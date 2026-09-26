import { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LogOut, 
  Calendar, 
  PlusSquare, 
  Users, 
  Settings, 
  BarChart2, 
  Shield, 
  Gavel, 
  Clock, 
  CheckSquare, 
  FileSpreadsheet, 
  ListChecks,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { getOrganizerEvents } from '../api/events';

// Create a context to share the selected event ID down to outlet components
export const EventContext = createContext<{
  selectedEventId: string | null;
  events: any[];
  refreshEvents: () => void;
}>({ selectedEventId: null, events: [], refreshEvents: () => {} });

export const OrganizerLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
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
    <EventContext.Provider value={{ selectedEventId, events, refreshEvents: loadEvents }}>
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
            <Link to="/organizer" className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center font-black text-sm text-white shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-black text-base tracking-widest uppercase text-white">
                ORGANIZER
              </span>
            </Link>
            <button 
              className="md:hidden text-white hover:text-red-500 p-1" 
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Middle Navigation - ONLY THIS CONTAINER SCROLLS (Scrollbar hidden) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            
            {/* Core Group */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-red-500" />
                <span>Overview</span>
              </div>
              <NavItem to="/organizer" icon={BarChart2} label="Dashboard Home" />
              <NavItem to="/organizer/events" icon={Calendar} label="Manage Events" />
            </div>

            {/* Event Operations */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                Event Ops
              </div>
              <NavItem to="/organizer/timeline" icon={Clock} label="Timeline" />
              <NavItem to="/organizer/tasks" icon={CheckSquare} label="Tasks" />
              <NavItem to="/organizer/rubrics" icon={ListChecks} label="Scoring Rubrics" />
            </div>

            {/* User Access Group */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                User Access & Submissions
              </div>
              <NavItem to="/organizer/admins" icon={Shield} label="Manage Admins" />
              <NavItem to="/organizer/judges" icon={Gavel} label="Manage Judges" />
              <NavItem to="/organizer/participants" icon={Users} label="Participants" />
              <NavItem to="/organizer/submissions" icon={FileSpreadsheet} label="Submissions" />
            </div>

            {/* System Group */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                System
              </div>
              <NavItem to="/organizer/export" icon={FileSpreadsheet} label="Export Data (CSV)" />
              <NavItem to="/organizer/settings" icon={Settings} label="Settings" />
            </div>

          </div>

          {/* Bottom Identity & Logout Footer */}
          <div className="p-4 border-t-4 border-black dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 space-y-3">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                {user?.staff_id?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                  {user?.name || 'Organizer Admin'}
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
            
            {/* Left Side: Mobile Menu Button & Organizer Identity Tag */}
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
              <button 
                className="md:hidden p-2 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" 
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 md:space-x-3 truncate">
                {/* Staff ID Tag (Never UUID) */}
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-2 border-red-500 font-mono text-xs font-black tracking-wider shadow-sm shrink-0">
                  {user?.staff_id || 'ORG-ROOT'}
                </span>

                {/* Organizer Name */}
                <span className="text-sm md:text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Organizer'}
                </span>

                {/* Role Tag */}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black font-black text-[10px] tracking-widest uppercase shrink-0">
                  ORGANIZER
                </span>
              </div>
            </div>
            
            {/* Right Side: Active Event, Online/Offline Badge & Theme Toggle */}
            <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
              
              {/* Active Event Pill */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg text-xs font-bold">
                <span className="text-zinc-500 dark:text-zinc-400 uppercase text-[10px]">Event:</span>
                <span className="font-black text-zinc-900 dark:text-white max-w-[140px] truncate">
                  {events.find(e => e.id === selectedEventId)?.name || (events.length > 0 ? events[0].name : 'None Selected')}
                </span>
              </div>

              {/* Online / Offline Sync Status Tag */}
              <div 
                className={`inline-flex items-center space-x-1.5 px-2.5 md:px-3 py-1.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-wider transition-colors shadow-sm ${
                  isOnline 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500' 
                    : 'bg-amber-50 text-amber-800 border-amber-500 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
                {isOnline ? <Wifi className="w-3.5 h-3.5 shrink-0 hidden sm:inline" /> : <WifiOff className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />}
                <span className="hidden xs:inline">{isOnline ? 'Online / Synced' : 'Offline (Cached)'}</span>
              </div>

              {/* Light / Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-2 border-black dark:border-zinc-600 text-zinc-900 dark:text-white transition-all shadow-sm"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
              </button>

              {/* Create Event Button (if none exist) */}
              {events.length === 0 && (
                <Link 
                  to="/organizer/events/new" 
                  className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-1.5 rounded-lg border-2 border-black text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Event</span>
                </Link>
              )}
            </div>
          </header>

          {/* Independent Scroll Container for Sub-Pages (Scrollbar hidden) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 text-zinc-900 dark:text-zinc-100 no-scrollbar">
            <Outlet />
          </div>
        </main>

        {/* ========================================================================= */}
        {/* LOGOUT CONFIRMATION MODAL                                                 */}
        {/* ========================================================================= */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b-2 border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-zinc-900 dark:text-white">
                  Confirm Logout
                </h3>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                Are you sure you want to log out of the Organizer Portal? You will need your Staff ID and password to log back in.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </EventContext.Provider>
  );
};
