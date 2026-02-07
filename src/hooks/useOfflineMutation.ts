import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { offlineQueue } from '@/lib/offline-queue';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OfflineMutationOptions<TData = unknown, TVariables = unknown> {
  /** The Supabase table name */
  table: string;
  /** The operation type */
  operation: 'create' | 'update' | 'delete';
  /** The online mutation function (runs when connected) */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate on success */
  invalidateKeys?: string[][];
  /** Extract record ID from variables (for update/delete) */
  getRecordId?: (variables: TVariables) => string;
  /** Success message */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Additional onSuccess handler */
  onSuccess?: (data: TData) => void | Promise<void>;
  /** Additional onError handler */
  onError?: (error: Error) => void;
}

export function useOfflineMutation<TData = unknown, TVariables = Record<string, any>>({
  table,
  operation,
  mutationFn,
  invalidateKeys = [],
  getRecordId,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: OfflineMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      // If online, proceed normally
      if (navigator.onLine) {
        return mutationFn(variables);
      }

      // If offline, queue the operation
      const recordId = getRecordId?.(variables);
      offlineQueue.addToQueue({
        table,
        operation,
        data: variables as Record<string, any>,
        recordId,
      });

      toast({
        title: 'Saved offline',
        description: 'Your changes will sync when you\'re back online.',
      });

      // Return a placeholder for optimistic updates
      return { ...variables, _offline: true } as unknown as TData;
    },
    onSuccess: async (data) => {
      // Only invalidate if we were online (actual API call succeeded)
      if (!(data as any)?._offline) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        if (successMessage) {
          toast({ title: successMessage });
        }
      }
      await onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (errorMessage) {
        toast({
          title: errorMessage,
          description: error.message,
          variant: 'destructive',
        });
      }
      onError?.(error);
    },
  });
}

/**
 * Process the offline queue by syncing pending operations with the server.
 * Called when the device comes back online.
 */
export async function syncOfflineQueue(
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const ops = offlineQueue.getRetryableOps();

  if (ops.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const op of ops) {
    offlineQueue.updateStatus(op.queueId, 'syncing');

    try {
      switch (op.operation) {
        case 'create': {
          const { _offline, ...data } = op.data;
          const { error } = await supabase.from(op.table as any).insert(data as any);
          if (error) throw error;
          break;
        }
        case 'update': {
          if (!op.recordId) throw new Error('No record ID for update');
          const { id, _offline, ...updates } = op.data;

          // Conflict resolution: check server timestamp
          const { data: serverRecord } = await supabase
            .from(op.table as any)
            .select('updated_at')
            .eq('id', op.recordId)
            .single();

          const serverUpdatedAt = (serverRecord as any)?.updated_at;
          if (serverUpdatedAt) {
            const serverTime = new Date(serverUpdatedAt).getTime();
            if (serverTime > op.timestamp) {
              // Server has newer data - skip this update (server wins)
              toast({
                title: 'Conflict resolved',
                description: `A ${op.table} record was updated by someone else. Server version kept.`,
              });
              offlineQueue.removeFromQueue(op.queueId);
              synced++;
              continue;
            }
          }

          const { error } = await supabase
            .from(op.table as any)
            .update(updates as any)
            .eq('id', op.recordId);
          if (error) throw error;
          break;
        }
        case 'delete': {
          if (!op.recordId) throw new Error('No record ID for delete');
          const { error } = await supabase.from(op.table as any).delete().eq('id', op.recordId);
          // If already deleted, that's fine
          if (error && !error.message.includes('not found')) throw error;
          break;
        }
      }

      offlineQueue.removeFromQueue(op.queueId);
      synced++;
    } catch (error) {
      offlineQueue.updateStatus(op.queueId, 'failed');
      failed++;
      console.error(`Failed to sync ${op.operation} on ${op.table}:`, error);
    }

    onProgress?.(synced, ops.length);
  }

  return { synced, failed };
}
