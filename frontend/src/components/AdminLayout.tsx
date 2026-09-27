import { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Gavel, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Menu, 
  X, 
  Sparkles, 
  ChevronRight,
  BarChart2,
  AlertTriangle
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Live Online / Offline Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode preference
    const isDark = document.documentElement.classList.contains('dark') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Navigation Item Helper
  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border-2 transition-all font-bold text-xs uppercase tracking-wider ${
          active
            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]'
            : 'text-zinc-700 dark:text-zinc-300 border-transparent hover:border-black dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-4 h-4 ${active ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
          <span>{label}</span>
        </div>
        {active && <ChevronRight className="w-3.5 h-3.5 text-red-500" />}
      </Link>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex flex-row">
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR (Independent Fixed-Height Scrolling)                              */}
      {/* ========================================================================= */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 w-64 md:w-72 h-screen bg-white dark:bg-zinc-900 border-r-4 border-black dark:border-zinc-800 flex flex-col z-50 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out shrink-0`}
      >
        {/* Top Logo / Branding Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b-4 border-black dark:border-zinc-800 bg-black dark:bg-zinc-950 text-white shrink-0">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center font-black text-sm text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-black text-base tracking-widest uppercase text-white">
              ADMIN
            </span>
          </Link>
          <button 
            className="md:hidden text-white hover:text-red-500 p-1" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Middle Navigation - ONLY THIS CONTAINER SCROLLS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          
          {/* Core Group */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>Overview</span>
            </div>
            <NavItem to="/admin" icon={BarChart2} label="Admin Dashboard" />
          </div>

          {/* User Access Group */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Staff & Judges
            </div>
            <NavItem to="/admin/judges" icon={Gavel} label="Manage Judges" />
          </div>

          {/* Security Group */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Security Operations
            </div>
            <NavItem to="/admin/resets" icon={Lock} label="Password Resets" />
          </div>

          {/* Data Management Group */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Data & Submissions
            </div>
            <NavItem to="/admin/submissions" icon={FileSpreadsheet} label="All Submissions" />
          </div>

        </div>

        {/* Bottom Identity & Logout Footer */}
        <div className="p-4 border-t-4 border-black dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 space-y-3">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
              {user?.staff_id?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 truncate">
                {user?.staff_id || user?.email}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg bg-black hover:bg-red-600 text-white dark:bg-zinc-800 dark:hover:bg-red-600 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-700 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA (Independent Content Scrolling)                         */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b-4 border-black dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
          
          {/* Left Side: Mobile Menu Button & Admin Tag */}
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
            <button 
              className="md:hidden p-2 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Admin Operations
              </span>
            </div>
          </div>

          {/* Right Side: Online Status & Dark Mode Toggle */}
          <div className="flex items-center space-x-3">
            
            {/* Live Connection Sync Indicator */}
            <div 
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border-2 ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300' 
                  : 'bg-rose-50 text-rose-800 border-rose-500 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">LIVE SYNC</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

          </div>
        </header>

        {/* Scrollable Main Child Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Confirm Logout
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Are you sure you want to end your administrative session? You will need your Staff ID and password to log back in.
            </p>
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-3 rounded-lg border-2 border-black dark:border-zinc-600 font-black text-xs uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
