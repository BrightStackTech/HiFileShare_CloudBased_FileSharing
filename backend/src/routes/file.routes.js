import { Router } from 'express';
import {
  uploadAndSendFiles,
  getRecentFiles,
  getFileHistory,
  getSharedFiles,
  deleteFile,
  downloadFile,
  previewFile
} from '../controllers/file.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

// All file routes require authentication
router.use(protect);

// POST /api/files/upload
router.post('/upload', uploadFiles.array('files', 10), uploadAndSendFiles);

// GET /api/files/recent
router.get('/recent', getRecentFiles);

// GET /api/files/history?type=sent|received
router.get('/history', getFileHistory);

// GET /api/files/shared/:username
router.get('/shared/:username', getSharedFiles);

// GET /api/files/download/:fileId
router.get('/download/:fileId', downloadFile);

// GET /api/files/preview/:fileId
router.get('/preview/:fileId', previewFile);

// DELETE /api/files/:fileId
router.delete('/:fileId', deleteFile);

export default router;
