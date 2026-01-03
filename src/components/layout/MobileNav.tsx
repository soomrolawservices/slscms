import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  MoreHorizontal,
  FileText,
  CreditCard,
  Receipt,
  Key,
  UserCog,
  Shield,
  Settings,
  LogOut,
  Wallet,
  UserPlus,
  BarChart3,
  MessageSquare,
  Sliders,
  Calculator
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavPreferences, ALL_NAV_ITEMS } from '@/hooks/useNavPreferences';
import { NavCustomizer } from './NavCustomizer';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  CreditCard,
  Receipt,
  Key,
  UserCog,
  Shield,
  Settings,
  Wallet,
  UserPlus,
  BarChart3,
  MessageSquare,
  Calculator,
};

// Admin-only nav items
const adminOnlyItems = ['users', 'permissions', 'assignments'];

// Team member available items
const teamMemberItems = ['dashboard', 'clients', 'cases', 'documents', 'payments', 'invoices', 'expenses', 'appointments', 'messages', 'credentials', 'settings'];

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { selectedTabs, isLoading } = useNavPreferences();

  // Filter nav items based on role
  const availableItemIds = isAdmin 
    ? ALL_NAV_ITEMS.map(item => item.id)
    : teamMemberItems;

  // Get selected tabs that are available for this user's role
  const visibleTabs = selectedTabs.filter(tab => availableItemIds.includes(tab.id));

  // Get all items for the "More" drawer (items not in bottom nav)
  const moreItems = ALL_NAV_ITEMS.filter(item => {
    const isAvailable = availableItemIds.includes(item.id);
    const isNotSelected = !visibleTabs.some(tab => tab.id === item.id);
    return isAvailable && isNotSelected;
  });

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className={className} /> : null;
  };

  if (isLoading) {
    return (
      <>
        <header className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/soomro-law-logo.png" alt="Soomro Law Services" className="w-7 h-7 object-contain" />
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SLS CMS
            </h1>
          </div>
          <div className="w-9 h-9 rounded-lg bg-muted/50 animate-pulse" />
        </header>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 px-2 py-2 flex-1">
                <div className="p-1.5 rounded-xl bg-muted/50 w-7 h-7 animate-pulse" />
                <div className="w-6 h-1.5 bg-muted/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Top Header - Mobile - With Notifications */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/soomro-law-logo.png" alt="Soomro Law Services" className="w-7 h-7 object-contain" />
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SLS CMS
          </h1>
        </div>
        <NotificationBell />
      </header>

      {/* Bottom Navigation - Compact Android-style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-0.5">
          {/* Dynamic tabs from user preferences */}
          {visibleTabs.map((item) => (
            <NavLink
              key={item.id}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-xs font-medium transition-all flex-1 min-w-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-1 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "bg-transparent"
                  )}>
                    {renderIcon(item.icon, 'h-4 w-4')}
                  </div>
                  <span className="text-[9px] truncate max-w-[48px]">{item.title}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button with drawer */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex-1 min-w-0"
              >
                <div className="p-1 rounded-lg bg-muted/50">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
                <span className="text-[9px]">More</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh] bg-card border-t-2 border-primary/20">
              <div className="p-4 pb-8 overflow-y-auto">
                {/* Drag handle */}
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
                
                {/* User info */}
                <div className="flex items-center gap-3 p-3 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{profile?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">More Options</h3>
                
                <div className="grid grid-cols-4 gap-3">
                  {moreItems.map((nav) => (
                    <button
                      key={nav.id}
                      onClick={() => {
                        navigate(nav.url);
                        setDrawerOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        {renderIcon(nav.icon, 'h-5 w-5 text-primary')}
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">{nav.title}</span>
                    </button>
                  ))}
                </div>

                {/* Customize Button */}
                <div className="mt-6 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 mb-3" 
                    onClick={() => {
                      setDrawerOpen(false);
                      setTimeout(() => setCustomizerOpen(true), 300);
                    }}
                  >
                    <Sliders className="h-4 w-4" />
                    Customize Navigation
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" 
                    onClick={() => {
                      logout();
                      setDrawerOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </nav>

      {/* Navigation Customizer */}
      <NavCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen} />
    </>
  );
}
