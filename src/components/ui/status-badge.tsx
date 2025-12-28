import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink' | 'cyan'> = {
  // General
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  blocked: 'error',
  
  // Case status
  open: 'info',
  in_progress: 'purple',
  closed: 'default',
  archived: 'default',
  
  // Payment status
  completed: 'success',
  failed: 'error',
  refunded: 'cyan',
  
  // Invoice status
  paid: 'success',
  unpaid: 'warning',
  overdue: 'error',
  partial: 'pink',
  
  // Appointment status
  scheduled: 'info',
  cancelled: 'error',
  rescheduled: 'purple',
  
  // Expense status
  approved: 'success',
  rejected: 'error',
  
  // User status
  online: 'success',
  offline: 'default',
  away: 'warning',
};

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm',
  warning: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm',
  error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm',
  info: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm',
  purple: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm',
  pink: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm',
  cyan: 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-sm',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, variant, size = 'md' }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariants[status.toLowerCase()] || 'default';
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full whitespace-nowrap',
        variantStyles[resolvedVariant],
        sizeStyles[size]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {displayStatus}
    </span>
  );
}