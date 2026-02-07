import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataFreshnessIndicatorProps {
  dataUpdatedAt: number;
  isFetching: boolean;
  className?: string;
}

export function DataFreshnessIndicator({
  dataUpdatedAt,
  isFetching,
  className,
}: DataFreshnessIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update "time ago" every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20',
          className
        )}
      >
        <WifiOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  if (isFetching) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20',
          className
        )}
      >
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Syncing...
      </div>
    );
  }

  const staleMinutes = Math.floor((now - dataUpdatedAt) / 60000);
  const isFresh = staleMinutes < 5;

  if (isFresh) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20',
          className
        )}
      >
        <Wifi className="h-3 w-3" />
        Live
      </div>
    );
  }

  const timeAgo =
    staleMinutes < 60
      ? `${staleMinutes}m ago`
      : staleMinutes < 1440
        ? `${Math.floor(staleMinutes / 60)}h ago`
        : `${Math.floor(staleMinutes / 1440)}d ago`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20',
        className
      )}
    >
      <Clock className="h-3 w-3" />
      Cached {timeAgo}
    </div>
  );
}
