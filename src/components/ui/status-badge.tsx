import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  // General
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  blocked: 'error',
  
  // Case status
  open: 'info',
  in_progress: 'warning',
  closed: 'default',
  archived: 'default',
  
  // Payment status
  completed: 'success',
  failed: 'error',
  refunded: 'info',
  
  // Invoice status
  paid: 'success',
  unpaid: 'warning',
  overdue: 'error',
  partial: 'info',
  
  // Appointment status
  scheduled: 'info',
  cancelled: 'error',
  rescheduled: 'warning',
  
  // Expense status
  approved: 'success',
  rejected: 'error',
};

const variantStyles = {
  default: 'bg-muted text-muted-foreground border-muted-foreground/20',
  success: 'bg-accent text-foreground border-foreground',
  warning: 'bg-muted text-foreground border-foreground',
  error: 'bg-destructive/10 text-destructive border-destructive',
  info: 'bg-primary/10 text-primary border-primary',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariants[status.toLowerCase()] || 'default';
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
        variantStyles[resolvedVariant]
      )}
    >
      {displayStatus}
    </span>
  );
}
