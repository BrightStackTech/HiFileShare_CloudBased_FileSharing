import { Server } from 'socket.io';

let io;
// Map to keep track of connected users: userId -> socketId
const userSocketMap = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Get userId from handshake auth
    const userId = socket.handshake.auth.userId;
    
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  return io;
};

export const getReceiverSocketId = (userId) => {
  return userSocketMap.get(userId.toString());
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
