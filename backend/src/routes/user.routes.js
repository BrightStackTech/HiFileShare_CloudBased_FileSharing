import { Router } from 'express';
import { searchUsers, getUserByUsername, getMe, deleteMe, updateMe } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadPfp } from '../middleware/upload.middleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// GET /api/users/me
router.get('/me', getMe);

// PUT /api/users/me
router.put('/me', uploadPfp.single('pfp'), updateMe);

// GET /api/users/search?q=
router.get('/search', searchUsers);

// DELETE /api/users/me
router.delete('/me', deleteMe);

// GET /api/users/:username
router.get('/:username', getUserByUsername);

export default router;
