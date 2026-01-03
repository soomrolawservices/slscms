import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { notifyAdmins, notifyTeamMembersForClient, notifyClientUser, notifyUser } from './useNotificationService';
import { format } from 'date-fns';

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
  reminder_minutes: number | null;
  reminder_sent: boolean | null;
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
  const { user, profile } = useAuth();

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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment scheduled successfully' });

      const appointmentDate = format(new Date(data.date), 'MMM d, yyyy');

      // Notify admins
      await notifyAdmins(
        'New Appointment Scheduled',
        `Appointment "${data.topic}" scheduled for ${appointmentDate} at ${data.time} by ${profile?.name || 'a team member'}`,
        'info',
        'appointment',
        data.id
      );

      // Notify client if linked
      if (data.client_id) {
        await notifyClientUser(
          data.client_id,
          'Appointment Scheduled',
          `Your appointment "${data.topic}" has been scheduled for ${appointmentDate} at ${data.time}`,
          'success',
          'appointment',
          data.id
        );
      }
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
