import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Upload,
  Shield,
  Users,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Instant File Sharing',
    desc: 'Upload and send files to anyone in seconds. No size headaches — up to 100 MB per file, 10 files at once.',
    color: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/20',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    desc: 'Every file is stored in AWS S3 with pre-signed URLs. Your data is never exposed without your permission.',
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
  },
  {
    icon: Users,
    title: 'Username-Based Sharing',
    desc: 'Send files directly to friends by their unique username (e.g. johny#1234) — no email needed.',
    color: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-500/20',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Cloud-native architecture means your files reach recipients almost instantly, wherever they are.',
    color: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
  },
  {
    icon: Lock,
    title: 'JWT Authentication',
    desc: 'Industry-standard JWT tokens keep your sessions safe. Email verification ensures only real users get in.',
    color: 'from-sky-500 to-blue-600',
    shadow: 'shadow-sky-500/20',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    desc: 'Browser-based and fully responsive. Access your files and history from any device, any time.',
    color: 'from-purple-500 to-fuchsia-600',
    shadow: 'shadow-purple-500/20',
  },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-[30%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">HiFileShare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Background image for hero only */}
        <div 
          className="absolute inset-0 z-[-1] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
          style={{ backgroundImage: "url('/hero_bg.png')", maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}
        />
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-[fadeIn_0.5s_ease-out]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Secure · Fast · Simple
        </div>

        {/* Name */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 animate-[slideUp_0.5s_ease-out]">
          <span className="bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            HiFile
          </span>
          <span className="bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Share
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-xl leading-relaxed mb-12 animate-[slideUp_0.6s_ease-out]">
          Share files with friends in an instant.{' '}
          <span className="text-slate-300">No fuss, no limits — just send.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-[slideUp_0.7s_ease-out]">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-2xl shadow-indigo-500/40 transition-all duration-200 active:scale-95"
          >
            Get Started — it's free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
          >
            Sign In
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-slate-500 text-sm animate-[fadeIn_1s_ease-out]">
          {['No credit card required', 'Email verification', 'AWS S3 storage', 'Open source'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to share files
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Built for speed and security, HiFileShare makes file sharing as easy as sending a message.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} shadow-xl ${f.shadow} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to start sharing?</h2>
          <p className="text-slate-400 mb-8">Create your free account in under a minute.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-2xl shadow-indigo-500/30 transition-all duration-200 active:scale-95"
          >
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center text-slate-600 text-sm">
        © 2024 HiFileShare. Made with ❤️
      </footer>
    </div>
  );
};

export default Landing;
