import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface PermissionData {
  id: string;
  role: AppRole;
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_read_own: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
  updated_at: string;
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module');

      if (error) throw error;
      return data as PermissionData[];
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PermissionData> & { id: string }) => {
      const { data, error } = await supabase
        .from('permissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({ title: 'Permission updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating permission', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PermissionData, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('permissions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({ title: 'Permission created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating permission', description: error.message, variant: 'destructive' });
    },
  });
}
