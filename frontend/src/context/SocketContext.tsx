import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user && token) {
      // The VITE_API_URL has /api at the end, but socket.io needs the base URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socketUrl = apiUrl.replace(/\/api$/, '');
      
      // Connect to the socket server
      const socketInstance = io(socketUrl, {
        auth: {
          userId: user.id || (user as any)._id,
        },
      });

      setSocket(socketInstance);

      // Cleanup on unmount or logout
      return () => {
        socketInstance.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
