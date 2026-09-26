import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/admin/login" className="text-xl font-bold text-indigo-600">
              DogFood Platform
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center text-sm text-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{user.email}</span>
                  <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs uppercase font-bold">
                    {user.role}
                  </span>
                </div>
                {user.role === 'participant' && <Link to="/admin/login" className="text-gray-600 hover:text-indigo-600">Participant Dashboard</Link>}
                {['organizer', 'judge', 'admin'].includes(user.role) && (
                  <Link to={`/${user.role}`} className="text-gray-600 hover:text-indigo-600">Staff Portal ({user.role})</Link>
                )}
                <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-red-600 transition">
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
                <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium transition">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
