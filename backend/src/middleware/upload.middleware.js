import multer from 'multer';

// Memory storage - files will be streamed directly to S3
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  // Allow all file types
  cb(null, true);
};

export const uploadFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10, // max 10 files at once
  },
});

// For profile picture - single image only
const pfpFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile picture'));
  }
};

export const uploadPfp = multer({
  storage: multer.memoryStorage(),
  fileFilter: pfpFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profile pic
    files: 1,
  },
});
