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
  MessageSquare,
  Calculator
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useITRPortalEnabled } from '@/hooks/useITRPortal';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessages';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

export function AppSidebar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { data: itrEnabled } = useITRPortalEnabled();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();
  const location = useLocation();

  const baseNavItems = isAdmin ? adminNavItems : teamNavItems;
  
  const navItems = itrEnabled 
    ? [...baseNavItems.slice(0, -1), { title: 'ITR Portal', url: '/itr', icon: Calculator }, baseNavItems[baseNavItems.length - 1]]
    : baseNavItems;

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const showBadge = item.url === '/messages' && unreadMessages > 0;
    const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');

    const content = (
      <NavLink
        to={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all rounded-lg relative group",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", collapsed && "h-5 w-5")} />
        {!collapsed && <span className="truncate">{item.title}</span>}
        {showBadge && (
          <Badge 
            variant="destructive" 
            className={cn(
              "h-5 min-w-[1.25rem] text-xs flex items-center justify-center",
              collapsed ? "absolute -top-1 -right-1" : "ml-auto"
            )}
          >
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </Badge>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
            {showBadge && ` (${unreadMessages})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col bg-sidebar transition-all duration-200 border-r border-sidebar-border/50 sticky top-0 h-screen z-40",
        collapsed ? "w-[60px]" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-14 border-b border-sidebar-border/30 flex-shrink-0",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-xs">SL</span>
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground truncate">Soomro Law</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Role indicator */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border/20">
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
            isAdmin 
              ? "bg-primary/15 text-primary" 
              : "bg-sidebar-accent text-sidebar-foreground/60"
          )}>
            {isAdmin ? 'Admin' : 'Team'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
          {navItems.map((item) => (
            <NavItem key={item.url} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className={cn(
        "border-t border-sidebar-border/30 flex-shrink-0",
        collapsed ? "p-2" : "p-3"
      )}>
        {!collapsed && (
          <div className="mb-2 px-2 py-1.5">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        )}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={logout}
              className={cn(
                "text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10",
                !collapsed && "w-full justify-start gap-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Logout</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
