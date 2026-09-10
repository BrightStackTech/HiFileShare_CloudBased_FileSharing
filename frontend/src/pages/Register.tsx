import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Upload, FolderOpen, CheckCircle, Info } from 'lucide-react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleProfileDialog } from '../components/auth/GoogleProfileDialog';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [pfp, setPfp] = useState<File | null>(null);
  const [pfpPreview, setPfpPreview] = useState<string>('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setAuth } = useAuthStore();

  // Google Auth Dialog State
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleData, setGoogleData] = useState<{ credential: string; email: string; name: string; pfpUrl: string } | null>(null);

  const handleGoogleSuccess = async (response: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.access_token || response.credential }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google Auth Failed');

      if (data.requireProfile) {
        setGoogleData({
          credential: response.access_token || response.credential,
          email: data.email,
          name: data.defaultName,
          pfpUrl: data.defaultPfp,
        });
        setShowGoogleDialog(true);
      } else {
        setAuth(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        navigate('/home');
      }
    } catch (err: any) {
      toast.error(err.message || 'Google Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error('Google Sign-In Failed'),
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.username.trim()) newErrors.username = 'Username is required';
    else if (!/^[a-zA-Z]{5,}#\d{4}$/.test(form.username))
      newErrors.username = 'Must be 5+ letters, # then 4 digits (e.g. johny#1234)';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPfp(file);
      setPfpPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('username', form.username);
      fd.append('password', form.password);
      fd.append('confirmPassword', form.confirmPassword);
      if (pfp) fd.append('pfp', pfp);

      await authApi.register(fd);
      toast.success('Account created! Check your email to verify.', { duration: 5000 });
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">HiFileShare</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Share files<br />securely &<br />effortlessly
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Upload, share, and manage your files with anyone — powered by AWS S3.
          </p>
        </div>
        <div className="relative space-y-4">
          {[
            'End-to-end secure file transfers',
            'Real-time user search',
            'Full file history',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 flex-shrink-0" />
              <span className="text-primary-100 text-sm">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">HiFileShare</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Already have one?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PFP upload */}
            <div className="flex flex-col items-center mb-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative group"
              >
                {pfpPreview ? (
                  <img src={pfpPreview} alt="pfp" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-500/30" />
                ) : (
                  <div className="avatar w-20 h-20 text-2xl ring-4 ring-primary-500/20">
                    {form.name ? getInitials(form.name) : '?'}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              </button>
              <span className="text-xs text-slate-400 mt-2">Click to upload profile picture</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Display Name</label>
              <input
                id="register-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Email</label>
              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Username</label>
              <input
                id="register-username"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                placeholder="johny#1234"
                className={`input-field ${errors.username ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.username ? (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>
              ) : (
                <p className="text-slate-400 text-xs mt-1 ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Min 5 letters + # + 4 digits (e.g. johny#1234)
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className={`input-field pr-11 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat your password"
                  className={`input-field pr-11 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <hr className="w-full border-slate-200 dark:border-slate-800" />
            <span className="p-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 uppercase font-semibold">
              Or
            </span>
            <hr className="w-full border-slate-200 dark:border-slate-800" />
          </div>

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Continue with Google
          </button>

          {showGoogleDialog && googleData && (
            <GoogleProfileDialog
              credential={googleData.credential}
              email={googleData.email}
              defaultName={googleData.name}
              defaultPfp={googleData.pfpUrl}
              onClose={() => setShowGoogleDialog(false)}
              onSuccess={(token, user) => {
                setShowGoogleDialog(false);
                setAuth(token, {
                  id: user.id || user._id,
                  name: user.name,
                  email: user.email,
                  username: user.username,
                  pfpUrl: user.pfpUrl,
                });
                toast.success(`Welcome to HiFileShare, ${user.name}! 🎉`);
                navigate('/home');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
