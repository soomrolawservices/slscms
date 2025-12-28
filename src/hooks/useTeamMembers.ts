import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'team_member';
}

export function useTeamMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      // Get users who have admin or team_member roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'team_member']);

      if (roleError) throw roleError;

      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', userIds)
        .eq('status', 'active');

      if (profileError) throw profileError;

      // Combine data
      const teamMembers: TeamMember[] = (profiles || []).map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: userRole?.role as 'admin' | 'team_member',
        };
      });

      return teamMembers;
    },
    enabled: !!user,
  });
}
