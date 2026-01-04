import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  target_type: string;
  target_role: 'admin' | 'team_member' | 'client' | null;
  target_user_id: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
}

export function useBroadcasts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BroadcastMessage[];
    },
    enabled: !!user,
  });
}

export function useActiveBroadcasts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['broadcasts', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      // Filter out dismissed broadcasts
      const { data: dismissals } = await supabase
        .from('broadcast_dismissals')
        .select('broadcast_id')
        .eq('user_id', user?.id || '');
      
      const dismissedIds = new Set(dismissals?.map(d => d.broadcast_id) || []);
      
      return (data as BroadcastMessage[]).filter(b => !dismissedIds.has(b.id));
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<BroadcastMessage, 'id' | 'created_at' | 'created_by'>) => {
      const { data: result, error } = await supabase
        .from('broadcast_messages')
        .insert({
          title: data.title,
          content: data.content,
          type: data.type,
          priority: data.priority,
          target_type: data.target_type,
          target_role: data.target_role,
          target_user_id: data.target_user_id,
          is_active: data.is_active,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast({ title: 'Broadcast created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating broadcast', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BroadcastMessage> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.target_type !== undefined) updateData.target_type = updates.target_type;
      if (updates.target_role !== undefined) updateData.target_role = updates.target_role;
      if (updates.target_user_id !== undefined) updateData.target_user_id = updates.target_user_id;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.starts_at !== undefined) updateData.starts_at = updates.starts_at;
      if (updates.ends_at !== undefined) updateData.ends_at = updates.ends_at;
      
      const { data, error } = await supabase
        .from('broadcast_messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast({ title: 'Broadcast updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating broadcast', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('broadcast_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast({ title: 'Broadcast deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting broadcast', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDismissBroadcast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('broadcast_dismissals')
        .insert({
          broadcast_id: broadcastId,
          user_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts', 'active'] });
    },
  });
}
