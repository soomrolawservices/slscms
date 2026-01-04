import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveBroadcasts, useDismissBroadcast } from '@/hooks/useBroadcasts';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

const priorityConfig = {
  info: {
    icon: Info,
    bannerClass: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
    iconClass: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bannerClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
    iconClass: 'text-yellow-500',
  },
  critical: {
    icon: AlertCircle,
    bannerClass: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    iconClass: 'text-red-500',
  },
};

export function BroadcastDisplay() {
  const { data: broadcasts = [] } = useActiveBroadcasts();
  const dismissBroadcast = useDismissBroadcast();
  const [modalBroadcast, setModalBroadcast] = useState<typeof broadcasts[0] | null>(null);
  const [shownModals, setShownModals] = useState<Set<string>>(new Set());

  // Show modal broadcasts
  useEffect(() => {
    const modalBroadcasts = broadcasts.filter(b => b.type === 'modal' && !shownModals.has(b.id));
    if (modalBroadcasts.length > 0) {
      setModalBroadcast(modalBroadcasts[0]);
      setShownModals(prev => new Set([...prev, modalBroadcasts[0].id]));
    }
  }, [broadcasts, shownModals]);

  const bannerBroadcasts = broadcasts.filter(b => b.type === 'banner');

  const handleDismiss = (id: string) => {
    dismissBroadcast.mutate(id);
  };

  const handleModalClose = () => {
    if (modalBroadcast) {
      handleDismiss(modalBroadcast.id);
      setModalBroadcast(null);
    }
  };

  if (bannerBroadcasts.length === 0 && !modalBroadcast) return null;

  return (
    <>
      {/* Banner Broadcasts */}
      {bannerBroadcasts.map((broadcast) => {
        const config = priorityConfig[broadcast.priority as keyof typeof priorityConfig] || priorityConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={broadcast.id}
            className={cn(
              'flex items-center justify-between gap-4 px-4 py-3 border-b',
              config.bannerClass
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={cn('h-5 w-5 shrink-0', config.iconClass)} />
              <div className="min-w-0">
                <span className="font-semibold mr-2">{broadcast.title}:</span>
                <span className="text-sm">{broadcast.content}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleDismiss(broadcast.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      {/* Modal Broadcast */}
      <Dialog open={!!modalBroadcast} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="border-2 border-border">
          {modalBroadcast && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const config = priorityConfig[modalBroadcast.priority as keyof typeof priorityConfig] || priorityConfig.info;
                    const Icon = config.icon;
                    return <Icon className={cn('h-5 w-5', config.iconClass)} />;
                  })()}
                  {modalBroadcast.title}
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  {modalBroadcast.content}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleModalClose}>Dismiss</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
