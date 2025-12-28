import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  Menu,
  FileText,
  CreditCard,
  Receipt,
  Key,
  UserCog,
  Shield,
  Settings
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { title: 'Home', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Schedule', url: '/appointments', icon: Calendar },
  { title: 'More', url: '#more', icon: Menu },
];

const allNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Invoices', url: '/invoices', icon: Receipt },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Credentials', url: '/credentials', icon: Key },
  { title: 'Users', url: '/users', icon: UserCog },
  { title: 'Permissions', url: '/permissions', icon: Shield },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();

  const filteredNavItems = allNavItems.filter(item => {
    // Hide admin-only pages from non-admins
    if (!isAdmin && (item.url === '/users' || item.url === '/permissions')) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Top Header - Mobile */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b-2 border-border bg-background sticky top-0 z-40">
        <h1 className="text-xl font-bold tracking-tight">LegalFlow</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 border-l-2 border-border">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Menu</h2>
              </div>
              
              <nav className="flex-1 space-y-1">
                {filteredNavItems.map((item) => (
                  <SheetClose key={item.url} asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium border-2 transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-transparent hover:bg-accent"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>

              <div className="pt-4 border-t-2 border-border">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-muted-foreground mb-4">{user?.email}</p>
                <Button variant="outline" className="w-full" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom Navigation Drawer - Mobile (Android-style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border z-40">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            if (item.url === '#more') {
              return (
                <Drawer key={item.url} open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className="flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex-1"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="border-t-2 border-border">
                    <div className="p-4 pb-8">
                      <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
                      <h3 className="text-lg font-bold mb-4">More Options</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {filteredNavItems
                          .filter(nav => !mobileNavItems.some(m => m.url === nav.url))
                          .map((nav) => (
                            <DrawerClose key={nav.url} asChild>
                              <NavLink
                                to={nav.url}
                                onClick={() => setDrawerOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                                    isActive
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:bg-accent"
                                  )
                                }
                              >
                                <nav.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{nav.title}</span>
                              </NavLink>
                            </DrawerClose>
                          ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            logout();
                            setDrawerOpen(false);
                          }}
                        >
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
                    "flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors flex-1",
                    isActive
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
