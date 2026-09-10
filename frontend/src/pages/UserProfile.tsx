import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Download, File as FileIcon, Upload, Eye, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { userApi, fileApi } from '../services/api';
import type { SearchUser, FileRecord } from '../types';
import Modal from '../components/ui/Modal';
import FilePreview from '../components/ui/FilePreview';
import toast from 'react-hot-toast';
import { handleViewFile } from '../utils/file';
import { getAuthenticatedFileUrl } from '../utils/fileUrl';
import { useSocket } from '../context/SocketContext';
// import { useAuthStore } from '../store/authStore';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<SearchUser | null>(null);
  const [sharedFiles, setSharedFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [userRes, filesRes] = await Promise.all([
        userApi.getUserByUsername(username),
        fileApi.getShared(username),
      ]);
      setUser(userRes.data.user);
      setSharedFiles(filesRes.data.files || []);
    } catch (err: any) {
      toast.error('User not found');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  const { socket } = useSocket();

  useEffect(() => { fetchData(); }, [fetchData]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewFile = () => fetchData();
    socket.on('new_file_received', handleNewFile);
    return () => {
      socket.off('new_file_received', handleNewFile);
    };
  }, [socket, fetchData]);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await fileApi.deleteFile(fileToDelete);
      toast.success('File removed');
      setFileToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove file');
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted) => setAttachedFiles((prev) => [...prev, ...accepted]),
  });

  const removeFile = (idx: number) => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSend = async () => {
    if (attachedFiles.length === 0) { toast.error('Attach at least one file'); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('recipientUsernames', JSON.stringify([username]));
      attachedFiles.forEach((f) => fd.append('files', f));
      await fileApi.uploadAndSend(fd);
      toast.success(`Files sent to ${user?.name || username}! 🎉`);
      setSendModalOpen(false);
      setAttachedFiles([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send files');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="card p-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile card */}
        <div className="card p-8 flex flex-col items-center gap-4 text-center">
          {user.pfpUrl ? (
            <img
              src={user.pfpUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-500/20 shadow-xl"
            />
          ) : (
            <div className="avatar w-24 h-24 text-3xl ring-4 ring-primary-500/20 shadow-xl">
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{user.username}</p>
          </div>
          <button
            id="open-send-modal"
            onClick={() => setSendModalOpen(true)}
            className="btn-primary"
          >
            <Send className="w-4 h-4" />
            Send File
          </button>
        </div>

        {/* Shared files */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Shared Files ({sharedFiles.length})
          </h2>

          {sharedFiles.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No shared files yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Files you send to or receive from {user.username} will appear here</p>
            </div>
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {sharedFiles.map((file) => (
                <div key={file._id} className="file-row">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>{formatSize(file.fileSize)}</span>
                      <span>·</span>
                      <span className={`badge px-1.5 py-0.5 text-[10px] ${file.direction === 'sent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                        {file.direction === 'sent' ? '↑ You sent' : '↓ You received'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(file.sentAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewFile(getAuthenticatedFileUrl(file.previewUrl || file.downloadUrl), file.fileName)}
                      className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={getAuthenticatedFileUrl(file.downloadUrl)}
                      download={file.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFileToDelete(file._id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send File Modal */}
      <Modal isOpen={sendModalOpen} onClose={() => { setSendModalOpen(false); setAttachedFiles([]); }} title={`Send files to ${user.username}`}>
        <div className="space-y-4">

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-700'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
                <Upload className={`w-6 h-6 ${isDragActive ? 'text-primary-600' : 'text-primary-400'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">or use the button below</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); open(); }}
                className="btn-secondary text-xs"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Attach Files
              </button>
            </div>
          </div>

          {attachedFiles.length > 0 && <FilePreview files={attachedFiles} onRemove={removeFile} />}

          <button
            id="modal-send-btn"
            onClick={handleSend}
            disabled={attachedFiles.length === 0 || sending}
            className="btn-primary w-full justify-center"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send {attachedFiles.length > 0 ? `${attachedFiles.length} File${attachedFiles.length > 1 ? 's' : ''}` : 'Files'}
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        title="Are you sure?"
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to remove this file from history? Once removed, this file will be permanently deleted and cannot be restored.
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setFileToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Yes Remove
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserProfile;
