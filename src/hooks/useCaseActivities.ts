import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface CaseActivity {
  id: string;
  case_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Json | null;
  created_at: string;
}

export function useCaseActivities(caseId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['case-activities', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      const { data, error } = await supabase
        .from('case_activities')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CaseActivity[];
    },
    enabled: !!user && !!caseId,
  });
}

export function useCreateCaseActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: {
      case_id: string;
      activity_type: string;
      title: string;
      description?: string;
      metadata?: Json;
    }) => {
      const { data, error } = await supabase
        .from('case_activities')
        .insert([{
          case_id: activity.case_id,
          user_id: user?.id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description || null,
          metadata: activity.metadata || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case-activities', variables.case_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error logging activity', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook to log case activities automatically when cases change
export function useLogCaseActivity() {
  const createActivity = useCreateCaseActivity();

  const logActivity = async (
    caseId: string,
    type: 'created' | 'status_change' | 'updated' | 'comment' | 'document' | 'assignment',
    title: string,
    description?: string,
    metadata?: Json
  ) => {
    await createActivity.mutateAsync({
      case_id: caseId,
      activity_type: type,
      title,
      description,
      metadata,
    });
  };

  return { logActivity, isLogging: createActivity.isPending };
}
