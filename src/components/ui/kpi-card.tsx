import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: {
    card: 'bg-card hover:shadow-lg',
    icon: 'bg-muted text-muted-foreground',
    trend: 'text-muted-foreground',
  },
  primary: {
    card: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20',
    icon: 'bg-primary-foreground/20 text-primary-foreground',
    trend: 'text-primary-foreground/80',
  },
  success: {
    card: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:shadow-lg hover:shadow-emerald-500/20',
    icon: 'bg-white/20 text-white',
    trend: 'text-white/80',
  },
  warning: {
    card: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20',
    icon: 'bg-white/20 text-white',
    trend: 'text-white/80',
  },
  info: {
    card: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20',
    icon: 'bg-white/20 text-white',
    trend: 'text-white/80',
  },
};

export function KpiCard({ title, value, icon: Icon, trend, className, variant = 'default' }: KpiCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 lg:p-6 shadow-md transition-all duration-300 animate-fade-in",
        styles.card,
        className
      )}
    >
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn(
            "text-sm font-medium uppercase tracking-wide",
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-3xl lg:text-4xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5",
                trend.value >= 0 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                  : "bg-red-500/20 text-red-600 dark:text-red-400"
              )}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn("text-xs", styles.trend)}>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          styles.icon
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}