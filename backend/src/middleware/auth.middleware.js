import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }

    const secret = process.env.JWT_SECRET;

    const decoded = jwt.verify(token, secret);

    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ success: false, message: 'Please verify your email first.' });
      return;
    }

    req.user = { id: decoded.id, email: decoded.email, username: decoded.username, name: user.name };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
