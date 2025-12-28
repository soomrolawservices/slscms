import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CredentialData {
  id: string;
  client_id: string;
  platform_name: string;
  url: string | null;
  username: string | null;
  password_encrypted: string | null;
  pin_code: string | null;
  created_by: string | null;
  created_at: string;
}

export function useCredentials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credentials')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { client_id: string; platform_name: string; url?: string; username?: string; password_encrypted?: string; pin_code?: string }) => {
      const { data: result, error } = await supabase
        .from('credentials')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({ title: 'Credential saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving credential', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CredentialData> & { id: string }) => {
      const { data, error } = await supabase
        .from('credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({ title: 'Credential updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating credential', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credentials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({ title: 'Credential deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting credential', description: error.message, variant: 'destructive' });
    },
  });
}
