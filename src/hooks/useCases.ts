import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { notifyTeamMembersForClient, notifyClientUser } from './useNotificationService';

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
  const { user, profile } = useAuth();

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

      // Auto-log case creation activity
      await supabase.from('case_activities').insert({
        case_id: data.id,
        activity_type: 'created',
        title: 'Case created',
        description: `New case "${caseData.title}" has been created`,
        user_id: user?.id,
        metadata: { initial_status: caseData.status || 'active' }
      });

      return { ...data, client_id: caseData.client_id };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case_activities'] });
      toast({ title: 'Case created successfully' });

      // Notify team members
      await notifyTeamMembersForClient(
        data.client_id,
        'New Case Created',
        `Case "${data.title}" has been created by ${profile?.name || 'a team member'}`,
        'info',
        'case',
        data.id,
        user?.id
      );

      // Notify the client user
      await notifyClientUser(
        data.client_id,
        'New Case Opened',
        `A new case "${data.title}" has been opened for you`,
        'info',
        'case',
        data.id
      );
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating case', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CaseData> & { id: string }) => {
      // Get the current case to check for changes
      const { data: currentCase } = await supabase
        .from('cases')
        .select('status, assigned_to, client_id, title')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log status change activity
      if (currentCase && updates.status && currentCase.status !== updates.status) {
        await supabase.from('case_activities').insert({
          case_id: id,
          activity_type: 'status_change',
          title: `Status changed to ${updates.status}`,
          description: `Case status updated from "${currentCase.status}" to "${updates.status}"`,
          user_id: user?.id,
          metadata: { old_status: currentCase.status, new_status: updates.status }
        });
      }

      // Log assignment change activity
      if (currentCase && updates.assigned_to && currentCase.assigned_to !== updates.assigned_to) {
        await supabase.from('case_activities').insert({
          case_id: id,
          activity_type: 'assignment',
          title: 'Case reassigned',
          description: 'Case has been assigned to a new team member',
          user_id: user?.id,
          metadata: { new_assignee: updates.assigned_to }
        });
      }

      return { ...data, oldStatus: currentCase?.status, statusChanged: currentCase && updates.status && currentCase.status !== updates.status };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case_activities'] });
      toast({ title: 'Case updated successfully' });

      // Notify on status change
      if (data.statusChanged && data.client_id) {
        await notifyTeamMembersForClient(
          data.client_id,
          'Case Status Updated',
          `Case "${data.title}" status changed to "${data.status}" by ${profile?.name || 'a team member'}`,
          'info',
          'case',
          data.id,
          user?.id
        );

        await notifyClientUser(
          data.client_id,
          'Case Status Updated',
          `Your case "${data.title}" status has been updated to "${data.status}"`,
          'info',
          'case',
          data.id
        );
      }
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
