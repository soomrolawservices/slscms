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
    <div className="min-h-screen w-full bg-background">
      {/* Header with notifications */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center">
                <span className="text-sm font-bold text-white">SL</span>
              </div>
              <span className="font-semibold hidden sm:inline">Client Portal</span>
            </div>
            <nav className="flex items-center gap-1">
              <Link to="/portal">
                <Button 
                  variant={location.pathname === '/portal' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "gap-1",
                    location.pathname === '/portal' && "bg-muted"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link to="/portal/profile">
                <Button 
                  variant={location.pathname === '/portal/profile' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "gap-1",
                    location.pathname === '/portal/profile' && "bg-muted"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
            </nav>
          </div>
          <NotificationBell />
        </div>
      </header>
      <main className="container max-w-6xl mx-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
