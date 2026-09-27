import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

export const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    } else if (!user.must_change_password) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `/api/auth/change-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ must_change_password: false });
      navigate(`/${user?.role}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        
        {/* Top Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950 text-red-600 border-2 border-red-500 flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.2)]">
            <KeyRound className="w-7 h-7" />
          </div>
        </div>

        {/* Header Tag */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-2 border-amber-500 font-mono text-[10px] font-black uppercase tracking-wider">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Mandatory First-Time Security Setup</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">
          First-Time Setup
        </h1>
        <p className="text-xs text-center text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
          You are using a temporary credential. Please create a permanent password to secure your account.
        </p>

        {/* Current Account Details */}
        <div className="p-3 mb-6 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 rounded space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Account Identified
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-zinc-900 dark:text-white">{user.name || 'Staff User'}</span>
            <span className="font-mono text-xs text-red-600 dark:text-red-400 font-black bg-red-50 dark:bg-red-950 px-2 py-0.5 border border-red-300 dark:border-red-800 rounded">
              {user.staff_id}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-2 border-red-400 p-3 mb-5 text-xs font-bold rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              New Permanent Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 text-sm transition"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Confirm Permanent Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 text-sm transition"
                placeholder="Retype password to confirm"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[4px_4px_0px_rgba(220,38,38,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-red-500" />
              <span>{isSubmitting ? 'Saving...' : 'Save and Continue'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
