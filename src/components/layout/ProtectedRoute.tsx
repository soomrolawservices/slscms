import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AllowedRole = 'admin' | 'team_member';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userRole } = useAuth();

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

  // If user role is not in allowed roles, redirect to dashboard
  if (userRole && !allowedRoles.includes(userRole as AllowedRole)) {
    if (userRole === 'team_member') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
