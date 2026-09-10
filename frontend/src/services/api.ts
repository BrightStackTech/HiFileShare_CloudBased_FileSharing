import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hfs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      localStorage.removeItem('hfs_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (formData: FormData) =>
    api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { identifier, password }),
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmNewPassword }),
};

// ─── Users ─────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  searchUsers: (q: string) => api.get(`/users/search?${new URLSearchParams({ q })}`),
  getUserByUsername: (username: string) => api.get(`/users/${encodeURIComponent(username)}`),
  updateMe: (formData: FormData) =>
    api.put('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAccount: () => api.delete('/users/me'),
};

// ─── Files ─────────────────────────────────────────────────────────────────
export const fileApi = {
  uploadAndSend: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getRecent: () => api.get('/files/recent'),
  getHistory: (type?: 'sent' | 'received') =>
    api.get(`/files/history${type ? `?type=${type}` : ''}`),
  getShared: (username: string) => api.get(`/files/shared/${encodeURIComponent(username)}`),
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
};

export default api;
