import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, FolderOpen, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleProfileDialog } from '../components/auth/GoogleProfileDialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Handle email verification redirect
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast.success('✅ Verification Successful! You can now log in.', {
        id: 'verify-success',
        duration: 5000,
        style: { fontWeight: '600' },
      });
    } else if (error === 'invalid_token') {
      toast.error('Invalid verification link.', { id: 'verify-error' });
    } else if (error === 'expired_token') {
      toast.error('Verification link expired. Please register again.', { id: 'verify-expired' });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(identifier.trim(), password);
      const { token, user } = res.data;
      setAuth(token, {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        pfpUrl: user.pfpUrl,
      });
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate('/home');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left panel */}
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
            Welcome<br />back!
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Sign in to access your files, share securely, and pick up right where you left off.
          </p>
        </div>
        <div className="relative space-y-4">
          {[
            'Login with email or username',
            'Secure JWT authentication',
            'Persistent sessions',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 flex-shrink-0" />
              <span className="text-primary-100 text-sm">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">HiFileShare</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Email or Username
              </label>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="john@example.com or johny#1234"
                className="input-field"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast('Feature not implemented yet!', { icon: '🚧' })}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input-field pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
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
                  Signing in…
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
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
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
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

          {/* Info box */}
          {/* <div className="mt-6 flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl">
            <AlertCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
              You must verify your email before logging in. Check your inbox for a verification link.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
