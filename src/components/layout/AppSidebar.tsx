import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Receipt, 
  Calendar, 
  Key, 
  UserCog,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const adminNavItems = [
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

const teamNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Clients', url: '/clients', icon: Users },
  { title: 'My Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isAdmin ? adminNavItems : teamNavItems;

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col border-r-2 border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-tight">LegalFlow</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors border-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "border-transparent hover:bg-accent hover:border-border"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t-2 border-border">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          onClick={logout}
          className="w-full"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
