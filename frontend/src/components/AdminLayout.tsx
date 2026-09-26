import { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, ShieldAlert, Lock, Gavel, FileSpreadsheet } from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center">
            <ShieldAlert className="w-6 h-6 mr-3 text-red-500" />
            <span className="text-xl font-bold tracking-wider text-red-500">ADMIN</span>
          </div>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-1">
            <Link to="/admin" onClick={() => setSidebarOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${isActive('/admin') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Home</span>
            </Link>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User Access</p>
              <Link to="/admin/judges" onClick={() => setSidebarOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${isActive('/admin/judges') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Gavel className="w-5 h-5 text-indigo-400" />
                <span>Manage Judges</span>
              </Link>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Security</p>
              <Link to="/admin/resets" onClick={() => setSidebarOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${isActive('/admin/resets') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Lock className="w-5 h-5" />
                <span>Password Resets</span>
              </Link>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data Management</p>
              <Link to="/admin/submissions" onClick={() => setSidebarOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-md transition ${isActive('/admin/submissions') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <FileSpreadsheet className="w-5 h-5" />
                <span>All Submissions</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.staff_id?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap text-slate-300">
              {user?.staff_id || user?.email}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-red-600 transition text-slate-300 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center px-4 md:px-8 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button className="md:hidden mr-4 text-gray-500 dark:text-gray-400" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Admin Panel</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
