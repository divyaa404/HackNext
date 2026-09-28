import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [passkey, setPasskey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPasskey = passkey.trim();
    if (!cleanPasskey) {
      setError('Please provide your temporary passkey.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/auth/reset-password`, {
        passkey: cleanPasskey,
        newPassword
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired passkey. Please check the code or contact the organizer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-text font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <Link
        to="/login"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 font-black uppercase tracking-widest bg-bauhaus-card border-4 border-bauhaus-border px-4 py-2 hover:bg-bauhaus-primary hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
      >
        <ArrowLeft size={16} /> Back to Login
      </Link>

      {/* Decorative Bauhaus Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-bauhaus-primary border-8 border-bauhaus-border -z-10 animate-bounce"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-bauhaus-secondary border-8 border-bauhaus-border transform rotate-12 -z-10"></div>
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border-[20px] border-bauhaus-accent rounded-full -translate-x-1/2 -translate-y-1/2 -z-20 opacity-20"></div>

      <div className="w-full max-w-md bg-bauhaus-card border-8 border-bauhaus-border p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 border-4 border-bauhaus-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <KeyRound className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">Reset Password</h2>
        <p className="text-xs text-center font-bold uppercase tracking-wider text-gray-600 mb-6">
          Enter your temporary passkey and choose a new password
        </p>

        {error && (
          <div className="bg-red-100 border-4 border-red-500 text-red-700 p-3 mb-6 text-sm font-bold uppercase">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border-4 border-emerald-500 text-emerald-950 p-5 text-sm font-medium space-y-2">
              <div className="flex items-center gap-2 font-black uppercase text-emerald-800 text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Password Changed!
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                Your password has been successfully updated. All previous sessions have been invalidated.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-black text-white py-4 px-4 border-4 border-bauhaus-border hover:bg-bauhaus-primary font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Sign In With New Password →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-bauhaus-primary" /> Temporary Passkey
              </label>
              <input
                type="text"
                value={passkey}
                onChange={e => setPasskey(e.target.value.toUpperCase())}
                placeholder="RST-XXXX-XXXX"
                className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black font-mono font-bold focus:outline-none focus:border-bauhaus-primary transition-colors text-sm"
                required
                autoFocus
              />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-1">
                Issued by your organizer (e.g. RST-A1B2-C3D4)
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black font-medium focus:outline-none focus:border-bauhaus-secondary transition-colors pr-12 text-sm"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black font-medium focus:outline-none focus:border-bauhaus-secondary transition-colors pr-12 text-sm"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 px-4 border-4 border-bauhaus-border hover:bg-red-700 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest border-t-2 border-gray-200 pt-4">
          Need a passkey?{' '}
          <Link to="/forgot-password" className="text-bauhaus-primary hover:text-bauhaus-secondary underline ml-1">
            Request Passkey
          </Link>
        </div>
      </div>
    </div>
  );
};
