import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`/api/auth/signup`, { email, password, role: 'participant' });
      // After signup, automatically login
      const loginRes = await axios.post(`/api/auth/login`, { email, password });
      login(loginRes.data.token, loginRes.data.user);
      navigate('/participant/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-text font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 font-black uppercase tracking-widest bg-bauhaus-card border-4 border-bauhaus-border px-4 py-2 hover:bg-bauhaus-primary hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
        ← Home
      </Link>
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-bauhaus-secondary border-8 border-bauhaus-border -z-10 animate-bounce"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-bauhaus-accent border-8 border-bauhaus-border transform rotate-12 -z-10"></div>
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border-[20px] border-bauhaus-primary rounded-full -translate-x-1/2 -translate-y-1/2 -z-20 opacity-20"></div>

      <div className="w-full max-w-md bg-bauhaus-card border-8 border-bauhaus-border p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <h2 className="text-4xl font-black text-center uppercase tracking-tighter mb-8">Register</h2>
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
            <label className="block text-sm font-black uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-4 border-bauhaus-border bg-white text-black focus:outline-none focus:ring-0 focus:border-bauhaus-secondary transition-colors font-medium"
              required
            />
          </div>
          <button type="submit" className="w-full bg-bauhaus-secondary text-black py-4 px-4 border-4 border-bauhaus-border hover:bg-bauhaus-accent font-black uppercase tracking-widest text-lg transition-colors">
            Create Account
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-bold uppercase tracking-widest">
          Already registered? <Link to="/login" className="text-bauhaus-primary hover:text-bauhaus-secondary underline ml-2">Login</Link>
        </div>
      </div>
    </div>
  );
};
