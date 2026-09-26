import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Lock, 
  User, 
  Mail, 
  Building2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const SetupWizard = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Completed State
  const [createdData, setCreatedData] = useState<{
    staff_id: string;
    email: string;
    password: string;
    token: string;
    user: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await axios.get('/api/auth/setup-status');
      setSetupRequired(res.data.isSetupRequired);
    } catch (err: any) {
      console.error('Failed to check setup status', err);
      // Fallback: assume setup could be possible
      setSetupRequired(true);
    } finally {
      setChecking(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/first-time-setup', {
        name,
        email,
        orgName,
        password
      });

      setCreatedData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete first-time setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (createdData?.token && createdData?.user) {
      login(createdData.token, createdData.user);
      navigate('/organizer');
    } else {
      navigate('/admin/login');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdData) return;
    const text = `Hackathon Platform Organizer Credentials:\nStaff ID / Login: ${createdData.staff_id}\nEmail: ${createdData.email}\nPassword: ${createdData.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-black border-t-red-600 rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            Checking Platform Setup Status...
          </p>
        </div>
      </div>
    );
  }

  // If already initialized
  if (!setupRequired && !createdData) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 border-2 border-green-600 text-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Platform Initialized
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
              An Organizer account is already active on this platform installation.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_rgba(220,38,38,1)]"
            >
              <span>Go to Admin / Organizer Login</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If setup completed just now
  if (createdData) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b-4 border-black dark:border-white pb-4">
            <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded">
                Self-Hosted Instance
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Setup Complete!
              </h1>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200 text-xs font-semibold">
            ⚠️ <strong>Save these credentials now:</strong> You are the master Organizer for this deployment.
          </div>

          {/* Credentials Box */}
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg">
            <div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                Organizer Staff ID / Login ID
              </div>
              <div className="font-mono font-black text-lg text-red-600 dark:text-red-400">
                {createdData.staff_id}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                Email
              </div>
              <div className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {createdData.email}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                Password
              </div>
              <div className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 p-2 border border-zinc-300 dark:border-zinc-700 rounded select-all">
                {createdData.password}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCopyCredentials}
              className="flex-1 py-3 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-500 flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
            </button>

            <button
              onClick={handleProceed}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Setup Form
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black dark:border-white pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-600 text-white rounded">
              First-Run Setup
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
              Initialize Platform
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">
              Create your Root Organizer account to start managing hackathons.
            </p>
          </div>
          <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black rounded-xl flex items-center justify-center shrink-0 shadow-sm font-black">
            <Sparkles className="w-6 h-6 text-red-500" />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Organizer Name */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-600" />
              <span>Organizer Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-600 text-zinc-900 dark:text-white font-medium text-sm focus:outline-none focus:border-red-600 transition"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-600" />
              <span>Organizer Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@university.edu"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-600 text-zinc-900 dark:text-white font-medium text-sm focus:outline-none focus:border-red-600 transition"
              required
            />
          </div>

          {/* Organization / College Name */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-600" />
              <span>Organization / College</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Apex Tech Club"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-600 text-zinc-900 dark:text-white font-medium text-sm focus:outline-none focus:border-red-600 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Master Password</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-black uppercase text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters or auto-generate"
                minLength={6}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-600 text-zinc-900 dark:text-white font-mono text-sm focus:outline-none focus:border-red-600 transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-sm uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(220,38,38,1)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <span>Create Organizer & Initialize</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            to="/admin/login"
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
          >
            Already initialized? Go to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
};
