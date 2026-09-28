import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`/api/auth/login`, { email, password });
      login(res.data.token, res.data.user);
      if (res.data.user?.must_change_password) {
        navigate('/change-password');
      } else {
        navigate(res.data.user.role === 'participant' ? '/' : `/${res.data.user.role}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-text font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 font-black uppercase tracking-widest bg-bauhaus-card border-4 border-bauhaus-border px-4 py-2 hover:bg-bauhaus-primary hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
        ← Home
      </Link>
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-bauhaus-primary border-8 border-bauhaus-border -z-10 animate-bounce"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-bauhaus-secondary border-8 border-bauhaus-border transform rotate-12 -z-10"></div>
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border-[20px] border-bauhaus-accent rounded-full -translate-x-1/2 -translate-y-1/2 -z-20 opacity-20"></div>

      <div className="w-full max-w-md bg-bauhaus-card border-8 border-bauhaus-border p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <h2 className="text-4xl font-black text-center uppercase tracking-tighter mb-8">Login</h2>
        {error && <div className="bg-red-100 border-4 border-red-500 text-red-700 p-3 mb-6 text-sm font-bold uppercase">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black focus:outline-none focus:ring-0 focus:border-bauhaus-primary transition-colors font-medium"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-black uppercase tracking-widest">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold uppercase tracking-widest text-bauhaus-primary hover:text-bauhaus-secondary underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black focus:outline-none focus:ring-0 focus:border-bauhaus-secondary transition-colors font-medium pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-4 px-4 border-4 border-bauhaus-border hover:bg-red-700 font-black uppercase tracking-widest text-lg transition-colors">
            Enter Dashboard
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-bold uppercase tracking-widest">
          New here? <Link to="/signup" className="text-bauhaus-accent hover:text-bauhaus-primary underline ml-2">Register</Link>
        </div>
      </div>
    </div>
  );
};