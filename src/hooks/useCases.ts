import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CaseData {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  status: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (caseData: { title: string; description?: string; client_id: string; status?: string }) => {
      const { data, error } = await supabase
        .from('cases')
        .insert({
          title: caseData.title,
          description: caseData.description,
          client_id: caseData.client_id,
          status: caseData.status || 'active',
          created_by: user?.id,
          assigned_to: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: 'Case created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating case', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CaseData> & { id: string }) => {
      const { data, error } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: 'Case updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating case', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: 'Case deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting case', description: error.message, variant: 'destructive' });
    },
  });
}
