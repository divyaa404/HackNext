import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`/api/auth/forgot-password`, { email: email.trim() });
      setMessage(res.data.message || 'Password reset request submitted.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit reset request. Please try again.');
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
      <div className="absolute top-12 left-12 w-28 h-28 rounded-full bg-bauhaus-secondary border-8 border-bauhaus-border -z-10"></div>
      <div className="absolute bottom-12 right-12 w-36 h-36 bg-bauhaus-accent border-8 border-bauhaus-border transform rotate-6 -z-10"></div>
      <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] border-[16px] border-bauhaus-primary rounded-full -translate-x-1/2 -translate-y-1/2 -z-20 opacity-15"></div>

      <div className="w-full max-w-md bg-bauhaus-card border-8 border-bauhaus-border p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-900 border-4 border-bauhaus-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <KeyRound className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">Forgot Password</h2>
        <p className="text-xs text-center font-bold uppercase tracking-wider text-gray-600 mb-6">
          Request a temporary reset passkey from event organizers
        </p>

        {error && (
          <div className="bg-red-100 border-4 border-red-500 text-red-700 p-3 mb-6 text-sm font-bold uppercase">
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border-4 border-emerald-500 text-emerald-950 p-4 text-sm font-medium space-y-2">
              <div className="flex items-center gap-2 font-black uppercase text-emerald-800">
                <CheckCircle2 className="w-5 h-5" /> Request Registered
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {message}
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-400 p-3 text-xs text-amber-900 font-medium">
              💡 <strong>Next Step:</strong> Contact your event organizer or administrator. Once they approve and share your passkey, use it to set your new password.
            </div>

            <Link
              to="/reset-password"
              className="w-full flex items-center justify-center bg-red-600 text-white py-4 px-4 border-4 border-bauhaus-border hover:bg-red-700 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              I Have My Passkey →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black uppercase tracking-widest mb-2">
                Registered Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="participant@example.com"
                className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black focus:outline-none focus:ring-0 focus:border-bauhaus-primary transition-colors font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 px-4 border-4 border-bauhaus-border hover:bg-red-700 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Reset Request'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/reset-password"
                className="text-xs font-black uppercase tracking-widest text-bauhaus-primary hover:text-bauhaus-secondary underline"
              >
                Already have a passkey? Enter it here
              </Link>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest border-t-2 border-gray-200 pt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-bauhaus-accent hover:text-bauhaus-primary underline ml-1">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
