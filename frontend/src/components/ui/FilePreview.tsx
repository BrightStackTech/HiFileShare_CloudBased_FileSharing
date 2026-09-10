import { X, File, Image, Film, FileText, Archive, Music } from 'lucide-react';

interface FilePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-emerald-500" />;
  if (mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-blue-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive className="w-5 h-5 text-amber-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FilePreview: React.FC<FilePreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {files.length} file{files.length > 1 ? 's' : ''} attached
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in group"
          >
            {/* Preview for images */}
            {file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="flex-shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilePreview;
