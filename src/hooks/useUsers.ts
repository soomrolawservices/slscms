import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { notifyAdmins, notifyUser } from './useNotificationService';

type UserStatus = Database['public']['Enums']['user_status'];
type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  cnic: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  role?: AppRole;
}

export function useUsers() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role,
        };
      });

      return usersWithRoles;
    },
    enabled: isAdmin,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, status, userName }: { userId: string; status: UserStatus; userName?: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, userName };
    },
    onSuccess: async (data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const statusMessages: Record<UserStatus, string> = {
        active: 'User has been approved',
        blocked: 'User has been blocked',
        pending: 'User status set to pending',
      };
      toast({ title: statusMessages[status] });

      // Notify the user about their status change
      if (status === 'active') {
        await notifyUser(
          data.id,
          'Account Approved',
          'Your account has been approved. You now have full access to the system.',
          'success'
        );
      } else if (status === 'blocked') {
        await notifyUser(
          data.id,
          'Account Blocked',
          'Your account has been blocked. Please contact support for assistance.',
          'error'
        );
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating user status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if user has a role entry
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User role updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating user role', description: error.message, variant: 'destructive' });
    },
  });
}
