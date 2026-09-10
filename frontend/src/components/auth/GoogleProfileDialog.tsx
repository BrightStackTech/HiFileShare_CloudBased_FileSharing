import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoogleProfileDialogProps {
  email: string;
  defaultName: string;
  defaultPfp: string;
  credential: string;
  onSuccess: (token: string, user: any) => void;
  onClose: () => void;
}

export const GoogleProfileDialog: React.FC<GoogleProfileDialogProps> = ({
  email,
  defaultName,
  defaultPfp,
  credential,
  onSuccess,
  onClose
}) => {
  const [displayName, setDisplayName] = useState(defaultName || '');
  const [username, setUsername] = useState('');
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultPfp || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPfpFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    const usernameRegex = /^[a-zA-Z]{5,}#\d{4}$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username must be at least 5 letters followed by # and 4 digits (e.g. johny#1234)');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('credential', credential);
      formData.append('username', username.trim());
      formData.append('name', displayName.trim());
      formData.append('pfpUrl', defaultPfp); 

      if (pfpFile) {
        formData.append('pfp', pfpFile);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete registration');
      }

      onSuccess(data.token, data.user);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Complete Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Almost there! Please pick a username and confirm your details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-slate-100">
                  <img src={previewUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Email (From Google)
              </label>
              <input type="text" value={email} disabled className="input-field bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-70" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Display Name
              </label>
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                className="input-field" 
                placeholder="John Doe" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Username (required)
              </label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value.toLowerCase())} 
                className="input-field" 
                placeholder="johny#1234" 
                required 
              />
              <p className="text-[10px] text-slate-500 mt-1 ml-1">Must be at least 5 letters followed by # and 4 digits.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-6">
              {loading ? 'Saving...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
