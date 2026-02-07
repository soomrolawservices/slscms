import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusBarProps {
  syncing: boolean;
  synced: number;
  total: number;
  failed: number;
  className?: string;
}

export function SyncStatusBar({ syncing, synced, total, failed, className }: SyncStatusBarProps) {
  if (!syncing && synced === 0 && failed === 0) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[101] text-center py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all',
        syncing
          ? 'bg-primary/10 text-primary border-b border-primary/20'
          : failed > 0
            ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
            : 'bg-accent/10 text-accent border-b border-accent/20',
        className
      )}
    >
      {syncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing {synced}/{total} changes...
        </>
      ) : failed > 0 ? (
        <>
          <AlertCircle className="h-4 w-4" />
          {synced} synced, {failed} failed — will retry
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          All changes synced
        </>
      )}
    </div>
  );
}
