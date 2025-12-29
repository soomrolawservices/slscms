import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const itrNavItems = [
  { path: '/itr', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/itr/clients', label: 'Clients', icon: Users },
  { path: '/itr/extensions', label: 'Extensions', icon: FileText },
];

export default function ITRLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* ITR Sub-navigation */}
      <div className="border-b-2 border-border">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {itrNavItems.map((item) => {
            const isActive = item.end 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ITR Content */}
      <Outlet />
    </div>
  );
}
