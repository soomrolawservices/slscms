import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { MobileFAB } from './MobileFAB';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SkipToMain } from '@/components/accessibility/SkipToMain';
import { BroadcastDisplay } from '@/components/broadcasts/BroadcastDisplay';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { PendingChangesIndicator } from '@/components/pwa/PendingChangesIndicator';
import { Skeleton } from '@/components/ui/skeleton';

export function AppLayout() {
  const { isAuthenticated, isLoading, profile, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="h-10 w-10 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-28 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
      <SkipToMain />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden min-w-0">
        <MobileNav />
        <BroadcastDisplay />
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between gap-4 h-14 px-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {profile && (
              <span className="text-sm text-muted-foreground hidden xl:inline truncate">
                Welcome, <span className="font-medium text-foreground">{profile.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PendingChangesIndicator />
            {isAdmin && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary mr-1">
                Admin
              </span>
            )}
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main id="main-content" className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden safe-area-pad">
          <Outlet />
        </main>
        <MobileFAB />
      </div>
    </div>
  );
}
