import { useState, useEffect } from 'react';
import { History as HistoryIcon, ArrowUpRight, ArrowDownLeft, Download, File as FileIcon, Eye, Trash2 } from 'lucide-react';
import { fileApi } from '../services/api';
import type { FileRecord } from '../types';
import { handleViewFile } from '../utils/file';
import { useSocket } from '../context/SocketContext';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { getAuthenticatedFileUrl } from '../utils/fileUrl';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

type TabType = 'all' | 'sent' | 'received';

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const { socket } = useSocket();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const type = activeTab === 'all' ? undefined : activeTab;
      const res = await fileApi.getHistory(type);
      setFiles(res.data.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewFile = () => fetchHistory();
    socket.on('new_file_received', handleNewFile);
    return () => {
      socket.off('new_file_received', handleNewFile);
    };
  }, [socket, fetchHistory]);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await fileApi.deleteFile(fileToDelete);
      toast.success('File removed successfully');
      fetchHistory();
    } catch (err) {
      toast.error('Failed to remove file');
    } finally {
      setFileToDelete(null);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Files', icon: <HistoryIcon className="w-4 h-4" /> },
    { id: 'sent', label: 'Sent', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'received', label: 'Received', icon: <ArrowDownLeft className="w-4 h-4" /> },
  ];

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">File History</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">All your sent and received files</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`history-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Files list */}
      {loading ? (
        <div className="card p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FileIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No files found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {activeTab === 'sent'
                ? "You haven't sent any files yet"
                : activeTab === 'received'
                ? "You haven't received any files yet"
                : "No file history yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {files.map((file) => {
            const isSent = file.direction === 'sent';
            let counterparts = (isSent ? file.recipientIds : [file.senderId]).filter(Boolean);
            if (counterparts.length === 0) {
              counterparts = [{ _id: 'deleted', name: 'Deleted User', username: 'deleted', pfpUrl: '' }] as any;
            }

            return (
              <div key={file._id} className="file-row items-start">
                {/* Direction icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSent
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-blue-50 dark:bg-blue-950/30'
                }`}>
                  {isSent
                    ? <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    : <ArrowDownLeft className="w-5 h-5 text-blue-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{file.fileName}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatSize(file.fileSize)}</span>
                    <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(file.sentAt)}</span>
                  </div>
                  {/* Counterpart users */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">
                      {isSent ? 'To:' : 'From:'}
                    </span>
                    {counterparts.map((u) => (
                      <span key={u.id || (u as any)._id} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pl-0.5 pr-2 py-0.5">
                        {u.pfpUrl ? (
                          <img src={u.pfpUrl} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-[7px] font-bold">
                            {getInitials(u.name)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{u.username}</span>
                      </span>
                    ))}
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
            );
          })}
        </div>
      )}

      {!loading && files.length > 0 && (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          Showing {files.length} file{files.length > 1 ? 's' : ''}
        </p>
      )}

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

export default History;
