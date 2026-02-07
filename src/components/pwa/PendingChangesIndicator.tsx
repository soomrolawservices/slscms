import { useState, useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import { offlineQueue } from '@/lib/offline-queue';
import { cn } from '@/lib/utils';

export function PendingChangesIndicator({ className }: { className?: string }) {
  const [count, setCount] = useState(offlineQueue.getPendingCount());

  useEffect(() => {
    // Update count when queue changes
    const update = () => setCount(offlineQueue.getPendingCount());
    const unsubscribe = offlineQueue.subscribe(update);
    return unsubscribe;
  }, []);

  if (count === 0) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20',
        className
      )}
      title={`${count} change${count !== 1 ? 's' : ''} pending sync`}
    >
      <CloudOff className="h-3 w-3" />
      {count} pending
    </div>
  );
}
