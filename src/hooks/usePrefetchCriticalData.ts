import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Pre-fetches critical data queries after login so pages are available offline
 * even if never visited. Runs silently in the background.
 */
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const prefetch = async () => {
      // Prefetch clients
      queryClient.prefetchQuery({
        queryKey: ['clients'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
      });

      // Prefetch cases
      queryClient.prefetchQuery({
        queryKey: ['cases'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('cases')
            .select('*, clients(name)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
      });

      // Prefetch appointments
      queryClient.prefetchQuery({
        queryKey: ['appointments'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true });
          if (error) throw error;
          return data;
        },
      });

      // Prefetch payments
      queryClient.prefetchQuery({
        queryKey: ['payments'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('payments')
            .select('*, clients(name), cases(title)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
      });

      // Prefetch expenses
      queryClient.prefetchQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
          if (error) throw error;
          return data;
        },
      });

      // Prefetch documents
      queryClient.prefetchQuery({
        queryKey: ['documents'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('documents')
            .select('*, clients(name), cases(title)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
      });
    };

    prefetch();
  }, [isAuthenticated, user, queryClient]);
}
