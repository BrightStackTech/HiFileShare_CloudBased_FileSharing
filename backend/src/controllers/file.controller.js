import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import crypto from 'crypto';
import s3Client, { S3_BUCKET_NAME, DeleteObjectCommand } from '../config/s3.js';
import File from '../models/file.model.js';
import User from '../models/user.model.js';
import { getReceiverSocketId, getIo } from '../socket.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

// Crypto helpers
function encryptBuffer(buffer) {
  const key = crypto.randomBytes(32); // AES-256 key
  const iv = crypto.randomBytes(12);  // GCM nonce
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, key, iv, authTag };
}

function decryptBuffer(encrypted, key, iv, authTag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// Helper: upload single file buffer to S3
const uploadFileToS3 = async (buffer, originalName, mimeType) => {
  const ext = path.extname(originalName);
  const s3Key = `files/${uuidv4()}${ext}`;

  const { encrypted, key, iv, authTag } = encryptBuffer(buffer);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: encrypted,
    ContentType: 'application/octet-stream', // Store as encrypted bytes
  });

  await s3Client.send(command);

  const s3Url = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  return { 
    s3Key, 
    s3Url,
    encryptionKey: key.toString('base64'),
    encryptionIv: iv.toString('base64'),
    encryptionAuthTag: authTag.toString('base64')
  };
};

// Helper: generate local download/preview URL
const getLocalUrl = (fileId, inline = false) => {
  const type = inline ? 'preview' : 'download';
  // Use relative API URL so frontend can append token, or return absolute if possible
  return `/api/files/${type}/${fileId}`;
};

const mapFileWithRecipients = (file, reqUserId) => {
  const downloadUrl = getLocalUrl(file.id);
  const previewUrl = getLocalUrl(file.id, true);
  const fallbackUser = {
    id: 'deleted_user',
    name: 'deleted_user',
    username: 'deleted_user',
    pfpUrl: 'https://res.cloudinary.com/bu4z2c1z/image/upload/v1789055693/dead-pfp.jpg'
  };
  const sender = file.sender || fallbackUser;
  let recipients = (file.recipients || []).map(r => r || fallbackUser);
  if (recipients.length === 0) recipients = [fallbackUser];
  const isSent = sender.id === reqUserId;
  return {
    ...file.toJSON(),
    _id: file.id, // Support legacy frontend code expecting _id
    senderId: sender,
    recipientIds: recipients,
    downloadUrl,
    previewUrl,
    direction: isSent ? 'sent' : 'received',
  };
};

// @desc   Upload files and send to recipients
// @route  POST /api/files/upload
export const uploadAndSendFiles = async (req, res) => {
  try {
    const { recipientUsernames } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files attached' });
      return;
    }

    if (!recipientUsernames) {
      res.status(400).json({ success: false, message: 'At least one recipient is required' });
      return;
    }

    let usernames = [];
    try {
      usernames = typeof recipientUsernames === 'string'
        ? JSON.parse(recipientUsernames)
        : recipientUsernames;
    } catch {
      usernames = [recipientUsernames];
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid recipients format' });
      return;
    }

    const recipients = await User.findAll({
      where: {
        username: { [Op.in]: usernames },
        isVerified: true,
      },
      attributes: ['id', 'username'],
    });

    if (recipients.length === 0) {
      res.status(404).json({ success: false, message: 'No valid recipients found' });
      return;
    }

    const recipientIds = recipients.map((r) => r.id);

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const { s3Key, s3Url, encryptionKey, encryptionIv, encryptionAuthTag } = await uploadFileToS3(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const newFile = await File.create({
          senderId: req.user.id,
          s3Key,
          s3Url,
          encryptionKey,
          encryptionIv,
          encryptionAuthTag,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          sentAt: new Date(),
        });

        await newFile.setRecipients(recipientIds);
        
        // Emulate mongoose returned object structure
        const fileObj = newFile.toJSON();
        fileObj.recipientIds = recipientIds;
        return fileObj;
      })
    );

    const io = getIo();
    uploadedFiles.forEach(file => {
      file.recipientIds.forEach(recipientId => {
        const socketId = getReceiverSocketId(recipientId);
        if (socketId) {
          io.to(socketId).emit('new_file_received', {
            senderName: req.user.name || 'Someone',
          });
        }
      });
    });

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) sent successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ success: false, message: 'Server error during file upload' });
  }
};

// @desc   Get recent files (sent + received), latest 20
// @route  GET /api/files/recent
export const getRecentFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const files = await File.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { senderId: userId },
              sequelize.literal(`EXISTS (SELECT 1 FROM file_recipients WHERE file_recipients.fileId = File.id AND file_recipients.userId = '${userId}')`)
            ]
          },
          sequelize.literal(`NOT EXISTS (SELECT 1 FROM file_hidden_by WHERE file_hidden_by.fileId = File.id AND file_hidden_by.userId = '${userId}')`)
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'username', 'pfpUrl'] },
        { model: User, as: 'recipients', attributes: ['id', 'name', 'username', 'pfpUrl'] },
      ],
      order: [['sentAt', 'DESC']],
      limit: 20
    });

    const enriched = files.map(file => mapFileWithRecipients(file, req.user.id));

    res.status(200).json({ success: true, files: enriched });
  } catch (error) {
    console.error('Get recent files error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get full history of sent and received files
// @route  GET /api/files/history?type=sent|received
export const getFileHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type; // 'sent' | 'received'

    const whereConditions = [
      sequelize.literal(`NOT EXISTS (SELECT 1 FROM file_hidden_by WHERE file_hidden_by.fileId = File.id AND file_hidden_by.userId = '${userId}')`)
    ];

    if (type === 'sent') {
      whereConditions.push({ senderId: userId });
    } else if (type === 'received') {
      whereConditions.push(sequelize.literal(`EXISTS (SELECT 1 FROM file_recipients WHERE file_recipients.fileId = File.id AND file_recipients.userId = '${userId}')`));
      whereConditions.push({ senderId: { [Op.ne]: userId } });
    } else {
      whereConditions.push({
        [Op.or]: [
          { senderId: userId },
          sequelize.literal(`EXISTS (SELECT 1 FROM file_recipients WHERE file_recipients.fileId = File.id AND file_recipients.userId = '${userId}')`)
        ]
      });
    }

    const files = await File.findAll({
      where: { [Op.and]: whereConditions },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'username', 'pfpUrl'] },
        { model: User, as: 'recipients', attributes: ['id', 'name', 'username', 'pfpUrl'] },
      ],
      order: [['sentAt', 'DESC']],
    });

    const enriched = files.map(file => mapFileWithRecipients(file, req.user.id));

    res.status(200).json({ success: true, files: enriched });
  } catch (error) {
    console.error('Get file history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get files shared with a specific user (sent to them or received from them)
// @route  GET /api/files/shared/:username
export const getSharedFiles = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    const targetUser = await User.findOne({ where: { username, isVerified: true } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const targetId = targetUser.id;

    const files = await File.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                senderId: userId,
                [Op.and]: sequelize.literal(`EXISTS (SELECT 1 FROM file_recipients WHERE file_recipients.fileId = File.id AND file_recipients.userId = '${targetId}')`)
              },
              {
                senderId: targetId,
                [Op.and]: sequelize.literal(`EXISTS (SELECT 1 FROM file_recipients WHERE file_recipients.fileId = File.id AND file_recipients.userId = '${userId}')`)
              }
            ]
          },
          sequelize.literal(`NOT EXISTS (SELECT 1 FROM file_hidden_by WHERE file_hidden_by.fileId = File.id AND file_hidden_by.userId = '${userId}')`)
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'username', 'pfpUrl'] },
        { model: User, as: 'recipients', attributes: ['id', 'name', 'username', 'pfpUrl'] },
      ],
      order: [['sentAt', 'DESC']],
    });

    const enriched = files.map(file => mapFileWithRecipients(file, req.user.id));

    res.status(200).json({
      success: true,
      files: enriched,
      targetUser: {
        name: targetUser.name,
        username: targetUser.username,
        pfpUrl: targetUser.pfpUrl,
      },
    });
  } catch (error) {
    console.error('Get shared files error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Remove/delete file
// @route  DELETE /api/files/:fileId
export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await File.findByPk(fileId, {
      include: [{ model: User, as: 'recipients' }, { model: User, as: 'hiddenBy' }]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isSender = file.senderId === userId;
    const isRecipient = file.recipients.some((r) => r.id === userId);

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this file' });
    }

    const isAlreadyHidden = file.hiddenBy.some((h) => h.id === userId);
    if (!isAlreadyHidden) {
      await file.addHiddenBy(userId);
      file.hiddenBy.push({ id: userId });
    }

    const senderHidden = file.hiddenBy.some(h => h.id === file.senderId);
    const allRecipientsHidden = file.recipients.every(r => 
      file.hiddenBy.some(h => h.id === r.id)
    );

    if (senderHidden && allRecipientsHidden) {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: file.s3Key,
      });
      try {
        await s3Client.send(command);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
      }
      
      await file.destroy();
      return res.status(200).json({ success: true, message: 'File permanently deleted' });
    } else {
      return res.status(200).json({ success: true, message: 'File removed from your history' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: 'Server error during deletion' });
  }
};

// Helper for downloading/previewing
const serveFile = async (req, res, inline) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;

    const file = await File.findByPk(fileId, {
      include: [{ model: User, as: 'recipients' }]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isSender = file.senderId === userId;
    const isRecipient = file.recipients.some((r) => r.id === userId);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: file.s3Key,
    });
    
    const s3Response = await s3Client.send(command);
    const encryptedBuffer = Buffer.from(await s3Response.Body.transformToByteArray());

    let finalBuffer = encryptedBuffer;

    if (file.encryptionKey && file.encryptionIv && file.encryptionAuthTag) {
      const key = Buffer.from(file.encryptionKey, 'base64');
      const iv = Buffer.from(file.encryptionIv, 'base64');
      const authTag = Buffer.from(file.encryptionAuthTag, 'base64');
      
      try {
        finalBuffer = decryptBuffer(encryptedBuffer, key, iv, authTag);
      } catch (decErr) {
        console.error('Decryption failed:', decErr);
        return res.status(500).json({ success: false, message: 'Failed to decrypt file' });
      }
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    if (inline) {
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    }

    res.send(finalBuffer);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ success: false, message: 'Server error downloading file' });
  }
};

// @desc   Download file
// @route  GET /api/files/download/:fileId
export const downloadFile = (req, res) => serveFile(req, res, false);

// @desc   Preview file
// @route  GET /api/files/preview/:fileId
export const previewFile = (req, res) => serveFile(req, res, true);
