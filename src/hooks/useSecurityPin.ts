import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SECURITY_PIN_KEY = 'security_pin';
const DEFAULT_PIN = '1234';

export function useSecurityPin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['security-pin', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_PIN;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user.id)
        .eq('preference_key', SECURITY_PIN_KEY)
        .single();

      if (error || !data) {
        return DEFAULT_PIN;
      }

      return (data.preference_value as { pin: string })?.pin || DEFAULT_PIN;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSecurityPin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPin: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // First check if preference exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('preference_key', SECURITY_PIN_KEY)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update({ 
            preference_value: { pin: newPin },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preference_key: SECURITY_PIN_KEY,
            preference_value: { pin: newPin },
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-pin'] });
      toast({ title: 'Security PIN Updated', description: 'Your security PIN has been changed successfully.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error updating PIN', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}
