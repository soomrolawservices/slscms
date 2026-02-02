import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users, Briefcase, Calendar, FileText, Receipt, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface FABAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  color: string;
  adminOnly?: boolean;
}

const fabActions: FABAction[] = [
  { icon: Users, label: 'New Client', path: '/clients?action=create', color: 'bg-blue-500' },
  { icon: Briefcase, label: 'New Case', path: '/cases?action=create', color: 'bg-green-500' },
  { icon: Calendar, label: 'Book Appointment', path: '/appointments?action=create', color: 'bg-purple-500' },
  { icon: FileText, label: 'Upload Document', path: '/documents?action=create', color: 'bg-orange-500' },
  { icon: Receipt, label: 'Create Invoice', path: '/invoices?action=create', color: 'bg-pink-500', adminOnly: true },
  { icon: CreditCard, label: 'Record Payment', path: '/payments?action=create', color: 'bg-emerald-500' },
];

export function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const visibleActions = fabActions.filter(action => !action.adminOnly || isAdmin);

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="lg:hidden fixed right-4 bottom-20 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      <div className={cn(
        "absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300 z-50",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {visibleActions.map((action, index) => (
          <button
            key={action.path}
            onClick={() => handleAction(action.path)}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full shadow-lg transition-all duration-300",
              action.color,
              "text-white hover:scale-105 active:scale-95"
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            <action.icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          isOpen && "rotate-45 bg-destructive hover:bg-destructive/90"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
