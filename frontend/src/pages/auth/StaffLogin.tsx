import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserCog, Users, Gavel, Eye, EyeOff } from 'lucide-react';

export const StaffLogin = () => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'organizer' | 'admin' | 'judge'>('organizer');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/auth/setup-status')
      .then(res => setSetupRequired(res.data.isSetupRequired))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        navigate('/admin/change-password');
      } else {
        navigate(`/${user.role}`);
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`/api/auth/login`, { staff_id: staffId, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        {setupRequired && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 rounded-lg text-amber-900 dark:text-amber-300 text-xs flex flex-col space-y-2 shadow-sm">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ No Organizer Account Found</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">This instance has not been initialized yet. Run the first-time setup wizard to create your Root Organizer account.</p>
            <Link
              to="/setup"
              className="inline-flex items-center justify-center py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition"
            >
              Start First-Run Setup &rarr;
            </Link>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950 text-red-600 border-2 border-red-500 flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-2 mx-auto flex justify-center">
          <span>Secure Staff Portal</span>
        </div>
        <h1 className="text-2xl font-black text-center text-zinc-900 dark:text-white mb-6 uppercase tracking-tight">Admin Portal</h1>

        {/* Role Selection Boxes */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setSelectedRole('organizer')}
            className={`flex flex-col items-center justify-center p-3 border-2 font-black text-xs uppercase tracking-wider transition ${selectedRole === 'organizer' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-black dark:hover:border-zinc-500'}`}
          >
            <UserCog className={`w-5 h-5 mb-1 ${selectedRole === 'organizer' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <span>Organizer</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex flex-col items-center justify-center p-3 border-2 font-black text-xs uppercase tracking-wider transition ${selectedRole === 'admin' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-black dark:hover:border-zinc-500'}`}
          >
            <Users className={`w-5 h-5 mb-1 ${selectedRole === 'admin' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('judge')}
            className={`flex flex-col items-center justify-center p-3 border-2 font-black text-xs uppercase tracking-wider transition ${selectedRole === 'judge' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-black dark:hover:border-zinc-500'}`}
          >
            <Gavel className={`w-5 h-5 mb-1 ${selectedRole === 'judge' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <span>Judge</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-2 border-red-400 p-3 mb-4 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">ID Number</label>
            <input
              type="text"
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 font-mono text-sm transition"
              placeholder="e.g. ORG-X7K4M92Q"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 dark:focus:border-red-500 text-sm transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 px-4 font-black text-sm uppercase tracking-wider border-2 border-black dark:border-white shadow-[4px_4px_0px_rgba(220,38,38,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Secure Login
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium uppercase tracking-wider">Are you a participant?</p>
          <Link to="/login" className="text-red-600 dark:text-red-400 font-black text-sm hover:underline uppercase tracking-wider transition">
            Go to Participant Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
