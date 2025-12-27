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
}

export function KpiCard({ title, value, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-border bg-card p-4 lg:p-6 shadow-xs hover:shadow-sm transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl lg:text-4xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.value >= 0 ? "text-foreground" : "text-destructive"
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
