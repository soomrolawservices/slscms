import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { MobileFAB } from './MobileFAB';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SkipToMain } from '@/components/accessibility/SkipToMain';
import { BroadcastDisplay } from '@/components/broadcasts/BroadcastDisplay';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SkipToMain />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        <MobileNav />
        {/* Broadcast Banners */}
        <BroadcastDisplay />
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between gap-4 p-4 border-b-2 border-border">
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main id="main-content" className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
        <MobileFAB />
      </div>
    </div>
  );
}