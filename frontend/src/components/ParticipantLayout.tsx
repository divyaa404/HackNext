import { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Users, FileText, LogOut, X, Sun, Moon, UserCircle, Menu, PlusCircle, LogIn, UserPlus } from 'lucide-react';

export const ParticipantLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
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

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const navLinks = [
    { label: 'Overview', path: '/', icon: User },
    { label: 'My Team', path: '/participant/team', icon: Users },
    { label: 'Join Team', path: '/participant/team/join', icon: PlusCircle },
    { label: 'Submission', path: '/participant/submission', icon: FileText },
    { label: 'Profile', path: '/participant/profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-fg font-sans selection:bg-bauhaus-primary selection:text-white flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-screen">

        {/* Global Universal Navbar */}
        <nav className="sticky top-0 left-0 right-0 px-4 md:px-8 py-3 flex justify-between items-center z-40 backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 border-b-4 border-black dark:border-white shadow-sm">
          <div className="flex items-center space-x-6">
            <Link to="/" className="font-black text-xl md:text-2xl tracking-tighter uppercase text-bauhaus-text flex items-center gap-2 group">
              <span className="w-4 h-4 bg-red-600 border-2 border-black inline-block group-hover:rotate-45 transition-transform"></span>
              <span>Hackathon</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all border-2 ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_rgba(220,38,38,1)]'
                        : 'bg-transparent text-zinc-700 dark:text-zinc-300 border-transparent hover:border-black dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button (Desktop & Mobile) */}
            <button 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-2 border-black dark:border-zinc-600 rounded transition-colors text-zinc-900 dark:text-white"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <span className="dark:hidden"><Moon size={18} /></span>
              <span className="hidden dark:block"><Sun size={18} /></span>
            </button>

            {/* Desktop Auth Controls - NO HAMBURGER IN DESKTOP */}
            <div className="hidden md:flex items-center space-x-2">
              {!user ? (
                <>
                  <Link 
                    to="/login" 
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition"
                  >
                    <LogIn size={14} />
                    <span>Log In</span>
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition"
                  >
                    <UserPlus size={14} />
                    <span>Register</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/participant/profile"
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-2 transition"
                  >
                    <div className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      {(user as any)?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <span>{(user as any)?.name || user?.email?.split('@')[0] || 'My Profile'}</span>
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-800 rounded transition"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button - STYLED & TACTILE (< md) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2.5 bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.3)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center rounded"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </nav>

        {/* Universal Mobile Drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm md:hidden animate-fadeIn" onClick={() => setDrawerOpen(false)}>
            <div
              className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-zinc-900 border-l-4 border-black dark:border-white flex flex-col transform transition-transform duration-300 ease-out translate-x-0 shadow-[-12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-12px_0px_0px_rgba(255,255,255,0.2)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer Top Header */}
              <div className="h-16 flex justify-between items-center px-5 border-b-4 border-black dark:border-zinc-700 bg-red-600 text-white">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-amber-400 border border-black inline-block rotate-45"></span>
                  <span className="text-base font-black tracking-wider uppercase">Navigation</span>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)} 
                  className="p-1.5 bg-black/20 hover:bg-black/40 border-2 border-white text-white rounded transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer User Card */}
              <div className="p-4 border-b-4 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
                {user ? (
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 border-2 border-black bg-amber-400 text-black flex items-center justify-center font-black text-xl rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-shrink-0">
                      {(user as any)?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black truncate text-zinc-900 dark:text-white">{(user as any)?.name || 'Participant'}</p>
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[9px] font-black uppercase tracking-wider rounded border border-red-400">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Welcome to Hackathon</p>
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-2 border-black dark:border-zinc-600 rounded shadow-xs"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider bg-red-600 text-white border-2 border-black rounded shadow-xs"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 font-bold uppercase tracking-wider text-xs">
                {navLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 border-2 transition-all rounded ${
                        isActive
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]'
                          : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        <span className="font-black">{item.label}</span>
                      </div>
                      {isActive && <span className="text-xs font-black">●</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer Actions */}
              {user && (
                <div className="p-4 border-t-4 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
                  <button 
                    onClick={() => { setDrawerOpen(false); setShowLogoutConfirm(true); }} 
                    className="flex items-center justify-center w-full px-4 py-3 text-xs font-black text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 border-2 border-red-600 hover:bg-red-600 hover:text-white uppercase tracking-wider transition-colors shadow-[2px_2px_0px_rgba(220,38,38,1)] rounded"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout Account
                  </button>
                </div>
              )}
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