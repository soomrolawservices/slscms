import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncOfflineQueue } from '@/hooks/useOfflineMutation';
import { offlineQueue } from '@/lib/offline-queue';
import { toast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0, failed: 0 });
  const queryClient = useQueryClient();

  const performSync = useCallback(async () => {
    const pendingCount = offlineQueue.getPendingCount();
    if (pendingCount === 0) return;

    setIsSyncing(true);
    setSyncProgress({ synced: 0, total: pendingCount, failed: 0 });

    toast({
      title: `Syncing ${pendingCount} change${pendingCount !== 1 ? 's' : ''}...`,
      description: 'Your offline changes are being uploaded.',
    });

    try {
      const result = await syncOfflineQueue((synced, total) => {
        setSyncProgress((prev) => ({ ...prev, synced, total }));
      });

      setSyncProgress({ synced: result.synced, total: pendingCount, failed: result.failed });

      if (result.failed > 0) {
        toast({
          title: `Sync partially complete`,
          description: `${result.synced} synced, ${result.failed} failed. Will retry later.`,
          variant: 'destructive',
        });
      } else if (result.synced > 0) {
        toast({
          title: 'All changes synced',
          description: `${result.synced} change${result.synced !== 1 ? 's' : ''} uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
      // Clear progress after a short delay
      setTimeout(() => setSyncProgress({ synced: 0, total: 0, failed: 0 }), 3000);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refetch all stale queries when coming back online
      queryClient.invalidateQueries();
      // Sync offline queue
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, performSync]);

  return { isOnline, isSyncing, syncProgress };
}
