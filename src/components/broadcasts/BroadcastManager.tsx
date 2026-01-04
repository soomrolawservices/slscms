import { useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, Radio, Users, User, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useBroadcasts, useCreateBroadcast, useUpdateBroadcast, useDeleteBroadcast, type BroadcastMessage } from '@/hooks/useBroadcasts';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { format } from 'date-fns';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useClients } from '@/hooks/useClients';

const TYPE_OPTIONS = [
  { value: 'banner', label: 'Banner (Top of Screen)' },
  { value: 'modal', label: 'Modal (Pop-up Dialog)' },
];

const PRIORITY_OPTIONS = [
  { value: 'info', label: 'Info (Blue)' },
  { value: 'warning', label: 'Warning (Yellow)' },
  { value: 'critical', label: 'Critical (Red)' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'role', label: 'Specific Role' },
  { value: 'user', label: 'Single User' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admins' },
  { value: 'team_member', label: 'Team Members' },
  { value: 'client', label: 'Clients' },
];

export function BroadcastManager() {
  const { data: broadcasts = [], isLoading } = useBroadcasts();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: clients = [] } = useClients();
  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast();
  const deleteBroadcast = useDeleteBroadcast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastMessage | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'banner',
    priority: 'info',
    target_type: 'all',
    target_role: '' as 'admin' | 'team_member' | 'client' | '',
    target_user_id: '',
    is_active: true,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'banner',
      priority: 'info',
      target_type: 'all',
      target_role: '',
      target_user_id: '',
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: '',
    });
  };

  const userOptions = [
    ...teamMembers.map(tm => ({ value: tm.id, label: `${tm.name} (Team)` })),
    ...clients.map(c => ({ value: c.id, label: `${c.name} (Client)` })),
  ];

  const columns: Column<BroadcastMessage>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge status={row.priority} />,
    },
    {
      key: 'target_type',
      header: 'Target',
      render: (row) => {
        if (row.target_type === 'all') return <span className="flex items-center gap-1"><Users className="h-4 w-4" /> All Users</span>;
        if (row.target_type === 'role') return <span className="flex items-center gap-1"><Radio className="h-4 w-4" /> {row.target_role}</span>;
        return <span className="flex items-center gap-1"><User className="h-4 w-4" /> Single User</span>;
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'starts_at',
      header: 'Schedule',
      render: (row) => (
        <div className="text-sm">
          <div>Starts: {format(new Date(row.starts_at), 'MMM d, yyyy HH:mm')}</div>
          {row.ends_at && <div className="text-muted-foreground">Ends: {format(new Date(row.ends_at), 'MMM d, yyyy HH:mm')}</div>}
        </div>
      ),
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBroadcast.mutateAsync({
      title: formData.title,
      content: formData.content,
      type: formData.type,
      priority: formData.priority,
      target_type: formData.target_type,
      target_role: formData.target_type === 'role' && formData.target_role ? formData.target_role as 'admin' | 'team_member' | 'client' : null,
      target_user_id: formData.target_type === 'user' ? formData.target_user_id : null,
      is_active: formData.is_active,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (broadcast: BroadcastMessage) => {
    setSelectedBroadcast(broadcast);
    setFormData({
      title: broadcast.title,
      content: broadcast.content,
      type: broadcast.type,
      priority: broadcast.priority,
      target_type: broadcast.target_type,
      target_role: (broadcast.target_role as 'admin' | 'team_member' | 'client' | '') || '',
      target_user_id: broadcast.target_user_id || '',
      is_active: broadcast.is_active,
      starts_at: broadcast.starts_at.slice(0, 16),
      ends_at: broadcast.ends_at?.slice(0, 16) || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBroadcast) return;
    await updateBroadcast.mutateAsync({
      id: selectedBroadcast.id,
      title: formData.title,
      content: formData.content,
      type: formData.type,
      priority: formData.priority,
      target_type: formData.target_type,
      target_role: formData.target_type === 'role' && formData.target_role ? formData.target_role as 'admin' | 'team_member' | 'client' : null,
      target_user_id: formData.target_type === 'user' ? formData.target_user_id : null,
      is_active: formData.is_active,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedBroadcast) return;
    await deleteBroadcast.mutateAsync(selectedBroadcast.id);
    setIsDeleteOpen(false);
    setSelectedBroadcast(null);
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid gap-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="System Maintenance"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="content">Message *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="The portal will be under maintenance from 2-4 AM..."
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Display Type</Label>
          <SearchableCombobox
            options={TYPE_OPTIONS}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Priority</Label>
          <SearchableCombobox
            options={PRIORITY_OPTIONS}
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Target Audience</Label>
        <SearchableCombobox
          options={TARGET_OPTIONS}
          value={formData.target_type}
          onChange={(value) => setFormData({ ...formData, target_type: value, target_role: '', target_user_id: '' })}
        />
      </div>
      {formData.target_type === 'role' && (
        <div className="grid gap-2">
          <Label>Select Role</Label>
          <SearchableCombobox
            options={ROLE_OPTIONS}
            value={formData.target_role}
            onChange={(value) => setFormData({ ...formData, target_role: value as 'admin' | 'team_member' | 'client' })}
            placeholder="Select a role..."
          />
        </div>
      )}
      {formData.target_type === 'user' && (
        <div className="grid gap-2">
          <Label>Select User</Label>
          <SearchableCombobox
            options={userOptions}
            value={formData.target_user_id}
            onChange={(value) => setFormData({ ...formData, target_user_id: value })}
            placeholder="Select a user..."
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="starts_at">Start Time *</Label>
          <Input
            id="starts_at"
            type="datetime-local"
            value={formData.starts_at}
            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ends_at">End Time (Optional)</Label>
          <Input
            id="ends_at"
            type="datetime-local"
            value={formData.ends_at}
            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Active</p>
          <p className="text-sm text-muted-foreground">Enable this broadcast immediately</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </div>
  );

  return (
    <Card className="border-2 border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Broadcast Messages
            </CardTitle>
            <CardDescription>Send system-wide announcements to users</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Broadcast
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <DataTable
          data={broadcasts}
          columns={columns}
          searchPlaceholder="Search broadcasts..."
          searchKey="title"
          isLoading={isLoading}
          actions={(row) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(row)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { setSelectedBroadcast(row); setIsDeleteOpen(true); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Broadcast</DialogTitle>
            <DialogDescription>Send an announcement to users</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createBroadcast.isPending}>
                {createBroadcast.isPending ? 'Creating...' : 'Create Broadcast'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Broadcast</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <FormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateBroadcast.isPending}>
                {updateBroadcast.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Broadcast"
        description="Are you sure you want to delete this broadcast? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </Card>
  );
}
