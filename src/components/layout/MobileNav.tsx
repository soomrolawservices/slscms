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
  MessageSquare
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { title: 'Home', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Schedule', url: '/appointments', icon: Calendar },
  { title: 'More', url: '#more', icon: MoreHorizontal },
];

const adminNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Invoices', url: '/invoices', icon: Receipt },
  { title: 'Expenses', url: '/expenses', icon: Wallet },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Credentials', url: '/credentials', icon: Key },
  { title: 'Assignments', url: '/assignments', icon: UserPlus },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Users', url: '/users', icon: UserCog },
  { title: 'Permissions', url: '/permissions', icon: Shield },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const teamNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Expenses', url: '/expenses', icon: Wallet },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const allNavItems = isAdmin ? adminNavItems : teamNavItems;
  const moreItems = allNavItems.filter(nav => !mobileNavItems.some(m => m.url === nav.url));

  return (
    <>
      {/* Top Header - Mobile - Simplified without hamburger */}
      <header className="lg:hidden flex items-center justify-center p-4 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SL</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Soomro Law
          </h1>
        </div>
      </header>

      {/* Bottom Navigation - Android-style System Tray */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-1">
          {mobileNavItems.map((item) => {
            if (item.url === '#more') {
              return (
                <Drawer key={item.url} open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex-1"
                    >
                      <div className="p-1.5 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px]">{item.title}</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh] bg-card border-t-2 border-primary/20">
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
                            key={nav.url}
                            onClick={() => {
                              navigate(nav.url);
                              setDrawerOpen(false);
                            }}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                              <nav.icon className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">{nav.title}</span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-border">
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
              );
            }

            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-all flex-1",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "p-1.5 rounded-xl transition-all",
                      isActive 
                        ? "bg-primary/15 text-primary shadow-sm" 
                        : "bg-transparent hover:bg-muted/50"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px]">{item.title}</span>
                    {isActive && (
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}