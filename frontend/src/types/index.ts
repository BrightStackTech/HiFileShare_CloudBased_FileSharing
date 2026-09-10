// Shared TypeScript types for HiFileShare

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  pfpUrl: string;
  createdAt?: string;
}

export interface FileRecord {
  _id: string;
  senderId: User;
  recipientIds: User[];
  s3Key: string;
  s3Url: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sentAt: string;
  previewUrl?: string;
  direction: 'sent' | 'received';
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface SearchUser {
  _id: string;
  name: string;
  username: string;
  pfpUrl: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
