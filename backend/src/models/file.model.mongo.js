import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    recipientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    hiddenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    s3Key: {
      type: String,
      required: [true, 'S3 key is required'],
    },
    s3Url: {
      type: String,
      required: [true, 'S3 URL is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    encryptionKey: {
      type: String,
      required: false,
    },
    encryptionIv: {
      type: String,
      required: false,
    },
    encryptionAuthTag: {
      type: String,
      required: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
fileSchema.index({ senderId: 1, sentAt: -1 });
fileSchema.index({ recipientIds: 1, sentAt: -1 });
fileSchema.index({ senderId: 1, recipientIds: 1 });

const File = mongoose.model('File', fileSchema);
export default File;
