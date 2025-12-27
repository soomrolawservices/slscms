import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  Menu,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Schedule', url: '/appointments', icon: Calendar },
];

const allNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents' },
  { title: 'Payments', url: '/payments' },
  { title: 'Invoices', url: '/invoices' },
  { title: 'Appointments', url: '/appointments' },
  { title: 'Credentials', url: '/credentials' },
  { title: 'Users', url: '/users' },
  { title: 'Settings', url: '/settings' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {/* Top Header - Mobile */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b-2 border-border bg-background sticky top-0 z-40">
        <h1 className="text-xl font-bold tracking-tight">LegalFlow</h1>
        <Sheet open={open} onOpenChange={setOpen}>
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
                {allNavItems.map((item) => (
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
                      {item.title}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>

              <div className="pt-4 border-t-2 border-border">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground mb-4">{user?.email}</p>
                <Button variant="outline" className="w-full" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border z-40">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => (
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
          ))}
        </div>
      </nav>
    </>
  );
}
