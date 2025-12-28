import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  entityType?: string;
  entityId?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  entityType,
  entityId,
}: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    entity_type: entityType,
    entity_id: entityId,
  });

  if (error) {
    console.error('Error creating notification:', error);
  }
  return { error };
}

// Helper function to notify all team members with access to a client
export async function notifyTeamMembersForClient(
  clientId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
  entityType?: string,
  entityId?: string
) {
  // Get team members who have this client assigned
  const { data: client } = await supabase
    .from('clients')
    .select('assigned_to, created_by')
    .eq('id', clientId)
    .maybeSingle();

  if (!client) return;

  const userIds = new Set<string>();
  if (client.assigned_to) userIds.add(client.assigned_to);
  if (client.created_by) userIds.add(client.created_by);

  // Also notify admins
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  admins?.forEach((a) => userIds.add(a.user_id));

  for (const userId of userIds) {
    await createNotification({ userId, title, message, type, entityType, entityId });
  }
}
