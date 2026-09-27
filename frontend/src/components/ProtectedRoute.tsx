import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface Props {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/admin/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'organizer') return <Navigate to="/organizer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/judges" replace />;
    if (user.role === 'judge') return <Navigate to="/judge" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
