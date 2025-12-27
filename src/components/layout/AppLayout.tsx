import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileNav />
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-end gap-4 p-4 border-b-2 border-border">
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
