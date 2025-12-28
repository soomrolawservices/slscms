import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AllowedRole = 'admin' | 'team_member' | 'client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not in allowed roles, redirect appropriately
  if (userRole && !allowedRoles.includes(userRole)) {
    // Clients should go to portal
    if (userRole === 'client') {
      return <Navigate to="/portal" replace />;
    }
    // Team members trying to access admin-only pages go to dashboard
    if (userRole === 'team_member') {
      return <Navigate to="/dashboard" replace />;
    }
    // Admins can access everything, but fallback to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
