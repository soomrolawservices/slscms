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

// Notify all admins
export async function notifyAdmins(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
  entityType?: string,
  entityId?: string
) {
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (!admins || admins.length === 0) return;

  for (const admin of admins) {
    await createNotification({
      userId: admin.user_id,
      title,
      message,
      type,
      entityType,
      entityId,
    });
  }
}

// Notify team members assigned to a client
export async function notifyTeamMembersForClient(
  clientId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
  entityType?: string,
  entityId?: string,
  excludeUserId?: string
) {
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

  // Exclude the user who triggered the action
  if (excludeUserId) userIds.delete(excludeUserId);

  for (const userId of userIds) {
    await createNotification({ userId, title, message, type, entityType, entityId });
  }
}

// Notify user linked to a client (the client user)
export async function notifyClientUser(
  clientId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
  entityType?: string,
  entityId?: string
) {
  const { data: clientAccess } = await supabase
    .from('client_access')
    .select('user_id')
    .eq('client_id', clientId);

  if (!clientAccess || clientAccess.length === 0) return;

  for (const access of clientAccess) {
    await createNotification({
      userId: access.user_id,
      title,
      message,
      type,
      entityType,
      entityId,
    });
  }
}

// Notify a specific user
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
  entityType?: string,
  entityId?: string
) {
  await createNotification({ userId, title, message, type, entityType, entityId });
}
