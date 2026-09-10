import { Router } from 'express';
import { register, verifyEmail, login, changePassword, googleAuth } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadPfp } from '../middleware/upload.middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', uploadPfp.single('pfp'), register);

// GET /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google
router.post('/google', uploadPfp.single('pfp'), googleAuth);

// POST /api/auth/change-password (protected)
router.post('/change-password', protect, changePassword);

export default router;
