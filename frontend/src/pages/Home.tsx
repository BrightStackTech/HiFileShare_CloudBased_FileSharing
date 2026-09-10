import { useState, useEffect, useCallback, useRef } from 'react';
import { Paperclip, Send, Clock, Download, File as FileIcon, Eye, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { userApi, fileApi } from '../services/api';
import type { SearchUser, FileRecord } from '../types';
import SearchDropdown from '../components/search/SearchDropdown';
import UserTag from '../components/ui/UserTag';
import FilePreview from '../components/ui/FilePreview';
import toast from 'react-hot-toast';
import { handleViewFile } from '../utils/file';
import { getAuthenticatedFileUrl } from '../utils/fileUrl';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/ui/Modal';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const Home: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch recent files
  const fetchRecent = useCallback(async () => {
    try {
      const res = await fileApi.getRecent();
      setRecentFiles(res.data.files || []);
    } catch {
      // silently fail
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const { socket } = useSocket();

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewFile = () => fetchRecent();
    socket.on('new_file_received', handleNewFile);
    return () => {
      socket.off('new_file_received', handleNewFile);
    };
  }, [socket, fetchRecent]);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await fileApi.deleteFile(fileToDelete);
      toast.success('File removed successfully');
      fetchRecent();
    } catch (err) {
      toast.error('Failed to remove file');
    } finally {
      setFileToDelete(null);
    }
  };

  // Debounced user search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await userApi.searchUsers(query);
        setSearchResults(res.data.users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 200); // fast debounce for per-character feel

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const addUser = (user: SearchUser) => {
    if (!selectedUsers.find((u) => u.username === user.username)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setQuery('');
    setSearchResults([]);
  };

  const removeUser = (username: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.username !== username));
  };

  // Dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted) => setAttachedFiles((prev) => [...prev, ...accepted]),
  });

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) { toast.error('Add at least one recipient'); return; }
    if (attachedFiles.length === 0) { toast.error('Attach at least one file'); return; }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append('recipientUsernames', JSON.stringify(selectedUsers.map((u) => u.username)));
      attachedFiles.forEach((f) => fd.append('files', f));
      await fileApi.uploadAndSend(fd);
      const recipientNames = selectedUsers.map(u => u.name).join(', ');
      const truncatedNames = recipientNames.length > 30 ? recipientNames.slice(0, 30) + '...' : recipientNames;
      toast.success(`Files sent to ${truncatedNames}! 🎉`);
      setSelectedUsers([]);
      setAttachedFiles([]);
      fetchRecent();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send files');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Send Files</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Search for users and share files instantly
        </p>
      </div>

      {/* Send panel */}
      <div className="card p-6 space-y-4">

        {/* Search */}
        <SearchDropdown
          query={query}
          onQueryChange={setQuery}
          results={searchResults}
          loading={searching}
          onSelectUser={addUser}
          selectedUsernames={selectedUsers.map((u) => u.username)}
        />

        {/* Selected user tags */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-slide-up">
            {selectedUsers.map((u) => (
              <UserTag key={u.username} user={u} onRemove={removeUser} />
            ))}
          </div>
        )}

        {/* Attach files area */}
        <div className="space-y-3 animate-slide-up">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-700'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
                  <Paperclip className={`w-6 h-6 ${isDragActive ? 'text-primary-600' : 'text-primary-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">or click the button below • Max 100MB each</p>
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

            {/* File preview */}
            {attachedFiles.length > 0 && (
              <FilePreview files={attachedFiles} onRemove={removeFile} />
            )}

            {/* Send button */}
            <button
              id="send-files-btn"
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
                  Send {attachedFiles.length > 0 ? `${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''}` : 'Files'}
                </>
              )}
            </button>
          </div>
      </div>

      {/* Recent Files */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Recent Files</h2>
        </div>

        {loadingRecent ? (
          <div className="card p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="card p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No files yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Send some files and they'll appear here</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {recentFiles.map((file) => (
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
                      {file.direction === 'sent' ? '↑ Sent' : '↓ Received'}
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
    </div>
  );
};

export default Home;
