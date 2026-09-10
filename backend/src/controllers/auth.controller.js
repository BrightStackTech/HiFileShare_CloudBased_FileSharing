import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/user.model.js';
import { Op } from 'sequelize';
import { sendVerificationEmail } from '../config/mailer.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: generate JWT
const generateToken = (id, email, username) => {
  return jwt.sign({ id, email, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateVerifyToken = () => {
  return jwt.sign({ uuid: uuidv4() }, process.env.JWT_VERIFY_SECRET, { expiresIn: '24h' });
};

// @desc   Register new user
// @route  POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, username } = req.body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword || !username) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match' });
      return;
    }

    // Validate username format: at least 5 letters + # + 4 digits
    const usernameRegex = /^[a-zA-Z]{5,}#\d{4}$/;
    if (!usernameRegex.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username must be at least 5 letters followed by # and 4 digits (e.g. johny#1234)',
      });
      return;
    }

    // Check if email or username already exists
    const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      res.status(409).json({ success: false, message: 'Username already taken' });
      return;
    }

    // Handle profile picture upload
    let pfpUrl = '';
    let pfpPublicId = '';

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'hifileshare/pfp');
        pfpUrl = result.url;
        pfpPublicId = result.publicId;
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        // Continue without pfp if upload fails
      }
    }

    // Generate verification token
    const verificationToken = generateVerifyToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      username,
      pfpUrl,
      pfpPublicId,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const verificationLink = `${apiUrl}/api/auth/verify/${verificationToken}`;
    try {
      await sendVerificationEmail(email, name, verificationLink);
    } catch (mailErr) {
      console.error('Mail send error:', mailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      res.status(409).json({ success: false, message: `${field} already exists` });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc   Verify email
// @route  GET /api/auth/verify/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify JWT token
    try {
      jwt.verify(token, process.env.JWT_VERIFY_SECRET);
    } catch {
      res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_token`);
      return;
    }

    // Find user with this token
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { [Op.gt]: new Date() },
      }
    });

    if (!user) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=expired_token`);
      return;
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
  } catch (error) {
    console.error('Verify email error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or username

    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Please provide email/username and password' });
      return;
    }

    // Find user by email or username
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await User.findOne({ where: { email: identifier.toLowerCase() } })
      : await User.findOne({ where: { username: identifier } });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Check if verified
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox.',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.username);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        pfpUrl: user.pfpUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc   Change password
// @route  POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ success: false, message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Authenticate/Register with Google
// @route  POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { credential, username, name, pfpUrl } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // Verify access token and get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });

    if (!userInfoRes.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google credential' });
    }

    const payload = await userInfoRes.json();
    const { email, sub: googleId, name: defaultName, picture: defaultPfp } = payload;

    // Check if user exists
    let user = await User.findOne({
      where: {
        [Op.or]: [{ googleId }, { email: email.toLowerCase() }]
      }
    });

    if (user) {
      // If user exists but doesn't have googleId linked, link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Auto-verify email
        await user.save();
      }

      // Generate token and login
      const token = generateToken(user.id, user.email, user.username);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          pfpUrl: user.pfpUrl,
        },
      });
    }

    // User does not exist. Are we trying to finalize registration?
    if (!username) {
      // Need more info
      return res.status(200).json({
        success: true,
        requireProfile: true,
        email: email.toLowerCase(),
        defaultName,
        defaultPfp,
      });
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z]{5,}#\d{4}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 5 letters followed by # and 4 digits (e.g. johny#1234)',
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Handle profile picture upload from the dialog
    let finalPfpUrl = pfpUrl || defaultPfp;
    let finalPfpPublicId = '';

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'hifileshare/pfp');
        finalPfpUrl = result.url;
        finalPfpPublicId = result.publicId;
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
      }
    }

    // Create user
    user = await User.create({
      name: name || defaultName,
      email: email.toLowerCase(),
      username,
      googleId,
      pfpUrl: finalPfpUrl,
      pfpPublicId: finalPfpPublicId,
      isVerified: true, // Google accounts are implicitly verified
    });

    const token = generateToken(user.id, user.email, user.username);
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        pfpUrl: user.pfpUrl,
      },
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};
