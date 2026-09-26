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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-gray-100">
        {setupRequired && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg text-amber-900 text-xs flex flex-col space-y-2 shadow-sm">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ No Organizer Account Found</span>
            </div>
            <p className="text-zinc-600">This instance has not been initialized yet. Run the first-time setup wizard to create your Root Organizer account.</p>
            <Link 
              to="/setup" 
              className="inline-flex items-center justify-center py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded transition"
            >
              Start First-Run Setup &rarr;
            </Link>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Admin Portal</h2>
        
        {/* Role Selection Boxes (Aesthetic) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button 
            type="button"
            onClick={() => setSelectedRole('organizer')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${selectedRole === 'organizer' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'} transition`}
          >
            <UserCog className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Organizer</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${selectedRole === 'admin' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'} transition`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Admin</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setSelectedRole('judge')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border ${selectedRole === 'judge' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'} transition`}
          >
            <Gavel className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Judge</span>
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input
              type="text"
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              placeholder="e.g. ORG-X7K4M92Q"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-900 text-white py-2 px-4 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition font-medium">
            Secure Login
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-2">Are you a participant?</p>
          <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-800 transition">
            Go to Participant Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
