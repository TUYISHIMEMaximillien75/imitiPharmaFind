import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
