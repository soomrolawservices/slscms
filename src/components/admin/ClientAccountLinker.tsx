import { useState } from 'react';
import { Link, UserPlus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface ClientAccess {
  id: string;
  user_id: string;
  client_id: string;
  created_at: string;
  profiles: { email: string; name: string } | null;
  clients: { name: string } | null;
}

export function ClientAccountLinker() {
  const queryClient = useQueryClient();
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ClientAccess | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  // Fetch existing links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['client-access-links'],
    queryFn: async () => {
      const { data: accessData, error } = await supabase
        .from('client_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and clients separately
      const enrichedData = await Promise.all(
        (accessData || []).map(async (access) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', access.user_id)
            .maybeSingle();

          const { data: client } = await supabase
            .from('clients')
            .select('name')
            .eq('id', access.client_id)
            .maybeSingle();

          return {
            ...access,
            profiles: profile,
            clients: client,
          };
        })
      );

      return enrichedData as ClientAccess[];
    },
  });

  // Fetch users with client role
  const { data: clientUsers = [] } = useQuery({
    queryKey: ['client-role-users'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');

      if (rolesError) throw rolesError;

      const userIds = roles.map(r => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ userId, clientId }: { userId: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_access')
        .insert({ user_id: userId, client_id: clientId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-links'] });
      toast({ title: 'Client account linked successfully' });
      setIsLinkOpen(false);
      setSelectedUser('');
      setSelectedClient('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error linking account', description: error.message, variant: 'destructive' });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-links'] });
      toast({ title: 'Link removed successfully' });
      setIsDeleteOpen(false);
      setSelectedLink(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing link', description: error.message, variant: 'destructive' });
    },
  });

  const columns: Column<ClientAccess>[] = [
    {
      key: 'profiles',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-medium">{row.profiles?.name || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">{row.profiles?.email}</p>
        </div>
      ),
    },
    {
      key: 'clients',
      header: 'Linked Client',
      render: (row) => <span className="font-medium">{row.clients?.name || 'Unknown'}</span>,
    },
    {
      key: 'created_at',
      header: 'Linked On',
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  const userOptions = clientUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));
  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name}${c.email ? ` - ${c.email}` : ''}` }));

  // Filter out already linked combinations
  const linkedUserIds = links.map(l => l.user_id);
  const availableUserOptions = userOptions.filter(u => !linkedUserIds.includes(u.value));

  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Client Account Links
            </CardTitle>
            <CardDescription>Link user accounts to client records for portal access</CardDescription>
          </div>
          <Button onClick={() => setIsLinkOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Link Account
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {clientUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No users with "client" role found.</p>
            <p className="text-sm">First assign the "client" role to users in the Users page.</p>
          </div>
        ) : (
          <DataTable
            data={links}
            columns={columns}
            searchPlaceholder="Search links..."
            searchKey="clients"
            title="Client Links"
            isLoading={isLoading}
            actions={(row) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => { setSelectedLink(row); setIsDeleteOpen(true); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          />
        )}
      </CardContent>

      {/* Link Modal */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Link Client Account</DialogTitle>
            <DialogDescription>Connect a user account to a client record for portal access</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>User Account</Label>
              <SearchableCombobox
                options={availableUserOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Select user..."
              />
              {availableUserOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">All client users are already linked</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Client Record</Label>
              <SearchableCombobox
                options={clientOptions}
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Select client..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
            <Button
              onClick={() => linkMutation.mutate({ userId: selectedUser, clientId: selectedClient })}
              disabled={!selectedUser || !selectedClient || linkMutation.isPending}
            >
              {linkMutation.isPending ? 'Linking...' : 'Link Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remove Link"
        description={`Are you sure you want to remove the link between ${selectedLink?.profiles?.name} and ${selectedLink?.clients?.name}?`}
        confirmLabel="Remove"
        onConfirm={() => selectedLink && unlinkMutation.mutate(selectedLink.id)}
        variant="destructive"
      />
    </Card>
  );
}
