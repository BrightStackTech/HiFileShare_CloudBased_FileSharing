import express from 'express';
import http from 'http';
import { initSocket } from './socket.js';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import fileRoutes from './routes/file.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;

// Connect to MySQL via Sequelize
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connected successfully via Sequelize');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ MySQL tables synced');
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err);
  });

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set Cross-Origin policies for Google OAuth popups
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

server.listen(PORT, () => {
  console.log(`🚀 HiFileShare server running on http://localhost:${PORT}`);
});

export default app;
