import User from '../models/user.model.js';
import File from '../models/file.model.js';
import { Op } from 'sequelize';
import s3Client, { S3_BUCKET_NAME, DeleteObjectCommand } from '../config/s3.js';
import { sendDeletionEmail } from '../config/mailer.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc   Search users by username (partial match, excludes self)
// @route  GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(200).json({ success: true, users: [] });
      return;
    }

    const query = q.trim();

    // Search by username (case-insensitive, partial match)
    const users = await User.findAll({
      where: {
        username: { [Op.like]: `%${query}%` },
        id: { [Op.ne]: req.user.id },
        isVerified: true,
      },
      attributes: ['name', 'username', 'pfpUrl'],
      limit: 10,
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get user profile by username
// @route  GET /api/users/:username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      where: { username, isVerified: true },
      attributes: ['name', 'username', 'pfpUrl', 'createdAt']
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get own profile
// @route  GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'verificationToken', 'verificationTokenExpiry'] }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Update own profile (name, username, pfp)
// @route  PUT /api/users/me
export const updateMe = async (req, res) => {
  try {
    const { name, username } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) {
      user.name = name;
    }

    if (username && username !== user.username) {
      const usernameRegex = /^[a-zA-Z]{5,}#\d{4}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ success: false, message: 'Username must be at least 5 letters followed by # and 4 digits (e.g. johny#1234)' });
      }

      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }

      user.username = username;
    }

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'hifileshare/pfp');
        user.pfpUrl = result.url;
        user.pfpPublicId = result.publicId;
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        return res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        pfpUrl: user.pfpUrl,
      }
    });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Delete own account and clean up S3
// @route  DELETE /api/users/me
export const deleteMe = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    // 1. Find all files where this user is sender or recipient
    const sentFiles = await File.findAll({
      where: { senderId: userId },
      include: [{ model: User, as: 'recipients' }, { model: User, as: 'hiddenBy' }]
    });

    const userWithReceived = await User.findByPk(userId, {
      include: [{
        model: File,
        as: 'receivedFiles',
        include: [{ model: User, as: 'recipients' }, { model: User, as: 'hiddenBy' }]
      }]
    });
    
    // Combine them, avoiding duplicates
    const allFilesMap = new Map();
    for (const f of sentFiles) allFilesMap.set(f.id, f);
    if (userWithReceived && userWithReceived.receivedFiles) {
      for (const f of userWithReceived.receivedFiles) allFilesMap.set(f.id, f);
    }
    const files = Array.from(allFilesMap.values());

    // 2. Iterate and process cleanup logic
    for (const file of files) {
      const isAlreadyHidden = file.hiddenBy.some(u => u.id === userId);
      if (!isAlreadyHidden) {
        await file.addHiddenBy(userId);
        file.hiddenBy.push({ id: userId }); // local state update for subsequent checks
      }

      // Check if all active parties have now hidden it
      const senderHidden = file.hiddenBy.some(h => h.id === file.senderId);
      const allRecipientsHidden = file.recipients.every(r => 
        file.hiddenBy.some(h => h.id === r.id)
      );

      if (senderHidden && allRecipientsHidden) {
        // Permanently delete from S3
        const command = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: file.s3Key,
        });
        try {
          await s3Client.send(command);
        } catch (s3Error) {
          console.error('Error deleting from S3 during account deletion:', s3Error);
        }
        
        // Delete from DB
        await file.destroy();
      }
    }

    // 3. Delete the User record
    const user = await User.findByPk(userId);
    if (user) {
      await user.destroy();
    }

    // 4. Send deletion email
    if (user && user.email) {
      try {
        await sendDeletionEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Failed to send deletion email:', emailError);
      }
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete me error:', error);
    res.status(500).json({ success: false, message: 'Server error during account deletion' });
  }
};
