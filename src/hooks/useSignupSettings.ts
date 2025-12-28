import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SignupSetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
  updated_at: string;
}

export function useSignupSettings() {
  return useQuery({
    queryKey: ['signup-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signup_settings')
        .select('*');

      if (error) throw error;
      
      // Convert to a record for easy access
      const settings: Record<string, boolean> = {};
      (data as SignupSetting[]).forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
      return settings;
    },
  });
}

export function useUpdateSignupSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { error } = await supabase
        .from('signup_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signup-settings'] });
      toast({ title: 'Settings updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    },
  });
}
