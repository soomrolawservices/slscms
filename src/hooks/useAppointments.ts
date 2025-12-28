import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface AppointmentData {
  id: string;
  date: string;
  time: string;
  topic: string;
  duration: number | null;
  type: string;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  platform: string | null;
  status: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
}

export function useAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as AppointmentData[];
    },
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<AppointmentData, 'id' | 'created_at' | 'created_by' | 'assigned_to'>) => {
      const { data: result, error } = await supabase
        .from('appointments')
        .insert({
          ...data,
          created_by: user?.id,
          assigned_to: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment scheduled successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error scheduling appointment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AppointmentData> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating appointment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment cancelled successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error cancelling appointment', description: error.message, variant: 'destructive' });
    },
  });
}
