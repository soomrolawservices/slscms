import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClientPortalLayout() {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/client-login" replace />;
  }

  // Redirect non-clients to main app
  if (userRole !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Header with notifications */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-white">SL</span>
              </div>
              <span className="font-semibold text-sm hidden sm:inline">Client Portal</span>
            </div>
            <nav className="flex items-center gap-0.5 sm:gap-1">
              <Link to="/portal">
                <Button 
                  variant={location.pathname === '/portal' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm",
                    location.pathname === '/portal' && "bg-muted"
                  )}
                >
                  <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:inline">Home</span>
                </Button>
              </Link>
              <Link to="/portal/profile">
                <Button 
                  variant={location.pathname === '/portal/profile' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm",
                    location.pathname === '/portal/profile' && "bg-muted"
                  )}
                >
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:inline">Profile</span>
                </Button>
              </Link>
            </nav>
          </div>
          <NotificationBell />
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
