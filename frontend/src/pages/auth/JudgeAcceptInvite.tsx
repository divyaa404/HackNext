import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export const JudgeAcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`/api/invites/accept`, { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invite');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black uppercase text-gray-900 mb-2">Accept Invitation</h2>
      <p className="text-gray-500 font-bold mb-8 text-sm">Set your password to join the platform.</p>
      
      {success && (
        <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-900 font-bold p-4 mb-4 text-sm">
          ✓ Account created successfully! Redirecting to login...
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 border-2 border-red-600 font-bold p-3 mb-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition">
          Create Account & Login
        </button>
      </form>
    </div>
  );
};
