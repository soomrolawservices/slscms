import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function ClientPortalLayout() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center">
              <span className="text-sm font-bold text-white">SL</span>
            </div>
            <span className="font-semibold">Client Portal</span>
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
