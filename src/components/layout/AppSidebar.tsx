import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Receipt,
  Wallet, 
  Calendar, 
  Key, 
  UserCog,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
  { title: 'My Clients', url: '/clients', icon: Users },
  { title: 'My Cases', url: '/cases', icon: Briefcase },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Expenses', url: '/expenses', icon: Wallet },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isAdmin ? adminNavItems : teamNavItems;

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col bg-gradient-to-b from-sidebar to-sidebar/95 transition-all duration-300 shadow-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border/30">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">SL</span>
            </div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Soomro Law</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
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
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border/30">
        {!collapsed && (
          <div className="mb-3 p-2 rounded-lg bg-sidebar-accent/30">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={logout}
          className="w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent border border-sidebar-border/30"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}