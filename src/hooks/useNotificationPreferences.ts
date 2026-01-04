import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  case_updates: boolean;
  document_uploads: boolean;
  appointment_reminders: boolean;
  invoice_alerts: boolean;
  message_notifications: boolean;
  system_announcements: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  case_updates: true,
  document_uploads: true,
  appointment_reminders: true,
  invoice_alerts: true,
  message_notifications: true,
  system_announcements: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      
      // Return existing preferences or defaults
      if (data) return data as NotificationPreferences;
      
      return { ...defaultPreferences, user_id: user?.id } as NotificationPreferences;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      // Check if preferences exist
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('user_id', user?.id || '')
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert({
            ...defaultPreferences,
            ...updates,
            user_id: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({ title: 'Preferences updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating preferences', description: error.message, variant: 'destructive' });
    },
  });
}
