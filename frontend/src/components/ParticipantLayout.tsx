import { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Users, FileText, LogOut, X, Sun, Moon, UserCircle } from 'lucide-react';

export const ParticipantLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    setDrawerOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handler = () => setDrawerOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Instead of conditional rendering for !isParticipant, wrap everything in the layout
  // so the navbar is always visible to everyone
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-fg font-sans selection:bg-bauhaus-primary selection:text-white flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-screen">

        {/* Global Universal Navbar */}
        <nav className="sticky top-0 left-0 right-0 px-6 py-4 flex justify-between items-center z-40 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b-2 border-bauhaus-border shadow-sm">
          <Link to="/" className="font-black text-2xl tracking-tighter uppercase text-bauhaus-text">Hackathon</Link>
          <div className="flex gap-4 items-center">
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-bauhaus-card border-2 border-transparent hover:border-bauhaus-border rounded-full transition-colors text-bauhaus-text">
              <span className="dark:hidden"><Moon size={20} /></span>
              <span className="hidden dark:block"><Sun size={20} /></span>
            </button>
            {!user ? (
              <Link to="/login" className="p-2 hover:bg-bauhaus-primary hover:text-white border-2 border-transparent hover:border-bauhaus-border rounded-full transition-colors flex items-center justify-center text-bauhaus-text">
                <UserCircle size={20} />
              </Link>
            ) : (
              <button onClick={() => setDrawerOpen(true)} className="p-2 hover:bg-bauhaus-primary hover:text-white border-2 border-transparent hover:border-bauhaus-border rounded-full transition-colors flex items-center justify-center text-bauhaus-text">
                <UserCircle size={20} />
              </button>
            )}
          </div>
        </nav>

        {/* Universal Drawer (Desktop & Mobile) */}
        {drawerOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setDrawerOpen(false)}>
            <div
              className="absolute inset-y-0 right-0 w-80 bg-bauhaus-card border-l-8 border-bauhaus-border flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 shadow-[-16px_0px_0px_rgba(0,0,0,1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-20 flex justify-between items-center px-6 border-b-4 border-bauhaus-border bg-bauhaus-primary text-white">
                <span className="text-xl font-black tracking-widest uppercase">Profile Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 border-2 border-transparent hover:border-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 border-b-4 border-bauhaus-border bg-bauhaus-bg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 border-4 border-bauhaus-border bg-bauhaus-secondary flex items-center justify-center font-black text-2xl text-black">
                    {(user as any)?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-lg font-black truncate text-bauhaus-text">{(user as any)?.name || 'Participant'}</p>
                    <p className="text-sm font-bold opacity-70 truncate text-bauhaus-text">{user?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 font-bold uppercase tracking-widest text-sm text-bauhaus-text">
                <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center px-4 py-4 hover:bg-bauhaus-primary hover:text-white border-4 border-transparent hover:border-bauhaus-border transition-colors">
                  <User className="w-5 h-5 mr-4" /> Home
                </Link>
                <Link to="/participant/profile" onClick={() => setDrawerOpen(false)} className="flex items-center px-4 py-4 hover:bg-bauhaus-primary hover:text-white border-4 border-transparent hover:border-bauhaus-border transition-colors">
                  <User className="w-5 h-5 mr-4" /> My Profile
                </Link>
                <Link to="/participant/team" onClick={() => setDrawerOpen(false)} className="flex items-center px-4 py-4 hover:bg-bauhaus-primary hover:text-white border-4 border-transparent hover:border-bauhaus-border transition-colors">
                  <Users className="w-5 h-5 mr-4" /> My Team / Entry
                </Link>
                <Link to="/participant/team/join" onClick={() => setDrawerOpen(false)} className="flex items-center px-4 py-4 hover:bg-bauhaus-primary hover:text-white border-4 border-transparent hover:border-bauhaus-border transition-colors">
                  <Users className="w-5 h-5 mr-4" /> Join Team
                </Link>
                <Link to="/participant/submission" onClick={() => setDrawerOpen(false)} className="flex items-center px-4 py-4 hover:bg-bauhaus-primary hover:text-white border-4 border-transparent hover:border-bauhaus-border transition-colors">
                  <FileText className="w-5 h-5 mr-4" /> Submissions
                </Link>
              </nav>

              <div className="p-6 border-t-4 border-bauhaus-border bg-bauhaus-bg">
                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className="flex items-center justify-center w-full px-4 py-4 text-base font-black text-red-600 border-4 border-red-600 hover:bg-red-600 hover:text-white uppercase tracking-widest transition-colors shadow-[4px_4px_0px_rgba(220,38,38,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                >
                  <LogOut className="w-5 h-5 mr-3" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-bauhaus-card border-4 border-bauhaus-border shadow-[12px_12px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-bauhaus-text">
                    Confirm Sign Out
                  </h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    End your active participant session
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Are you sure you want to log out? Any unsaved edits will be discarded.
              </p>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border-4 border-bauhaus-border bg-zinc-100 dark:bg-zinc-800 text-bauhaus-text font-black text-xs uppercase tracking-wider hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-95"
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};