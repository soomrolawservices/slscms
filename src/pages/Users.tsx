import { useState } from 'react';
import { MoreHorizontal, Check, X, Eye, UserCog, Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableDataTable, type EditableColumn } from '@/components/ui/editable-data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useUsers, useUpdateUserStatus, useUpdateUserRole, useUpdateUserProfile, type UserWithRole } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type UserStatus = Database['public']['Enums']['user_status'];
type AppRole = Database['public']['Enums']['app_role'];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500' },
];

const ROLE_OPTIONS = [
  { value: 'team_member', label: 'Team Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Client' },
];

export default function Users() {
  const { isAdmin } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const updateUserStatus = useUpdateUserStatus();
  const updateUserRole = useUpdateUserRole();
  const updateUserProfile = useUpdateUserProfile();

  const [activeTab, setActiveTab] = useState('all');
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('team_member');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredUsers = users.filter((user) =>
    activeTab === 'all' ? true : user.status === activeTab
  );

  const columns: EditableColumn<UserWithRole>[] = [
    {
      key: 'name',
      header: 'User',
      editable: false,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={row.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {row.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      editable: true,
      editType: 'tel',
      bulkEditable: false,
    },
    {
      key: 'cnic',
      header: 'CNIC',
      editable: true,
      editType: 'text',
      bulkEditable: false,
    },
    {
      key: 'role',
      header: 'Role',
      editable: true,
      editType: 'select',
      options: ROLE_OPTIONS,
      bulkEditable: true,
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'status',
      options: STATUS_OPTIONS,
      bulkEditable: true,
    },
  ];

  const handleUpdate = async (id: string, key: string, value: string) => {
    if (key === 'status') {
      await updateUserStatus.mutateAsync({ userId: id, status: value as UserStatus });
    } else if (key === 'role') {
      await updateUserRole.mutateAsync({ userId: id, role: value as AppRole });
    } else {
      await updateUserProfile.mutateAsync({ userId: id, [key]: value });
    }
  };

  const handleBulkUpdate = async (ids: string[], updates: Record<string, string>) => {
    const key = Object.keys(updates)[0];
    const value = updates[key];
    
    for (const id of ids) {
      await handleUpdate(id, key, value);
    }
  };

  const handleApprove = async (user: UserWithRole) => {
    await updateUserStatus.mutateAsync({ userId: user.id, status: 'active' });
  };

  const handleRejectClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsRejectOpen(true);
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    await updateUserStatus.mutateAsync({ userId: selectedUser.id, status: 'blocked' });
    setIsRejectOpen(false);
    setSelectedUser(null);
  };

  const handleBlockClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsBlockOpen(true);
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    await updateUserStatus.mutateAsync({ userId: selectedUser.id, status: 'blocked' });
    setIsBlockOpen(false);
    setSelectedUser(null);
  };

  const handleUnblock = async (user: UserWithRole) => {
    await updateUserStatus.mutateAsync({ userId: user.id, status: 'active' });
  };

  const handleChangeRoleClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'team_member');
    setIsRoleOpen(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    await updateUserRole.mutateAsync({ userId: selectedUser.id, role: selectedRole });
    setIsRoleOpen(false);
    setSelectedUser(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage team members and access</p>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {users.filter((u) => u.status === 'pending').length > 0 && (
        <div className="border-2 border-border bg-muted/50 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Pending Approval Requests</p>
            <p className="text-sm text-muted-foreground">
              {users.filter((u) => u.status === 'pending').length} users waiting for approval
            </p>
          </div>
          <Button variant="outline" onClick={() => setActiveTab('pending')}>Review</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <EditableDataTable
            data={filteredUsers}
            columns={columns}
            searchPlaceholder="Search users..."
            searchKey="name"
            title="Users"
            isLoading={isLoading}
            onUpdate={handleUpdate}
            selectable={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkUpdate={handleBulkUpdate}
            isUpdating={updateUserStatus.isPending || updateUserRole.isPending || updateUserProfile.isPending}
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Activity</DropdownMenuItem>
                  {row.status === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => handleApprove(row)}><Check className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleRejectClick(row)}><X className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                    </>
                  )}
                  {row.status === 'active' && row.role !== 'admin' && (
                    <DropdownMenuItem className="text-destructive" onClick={() => handleBlockClick(row)}><Shield className="h-4 w-4 mr-2" />Block</DropdownMenuItem>
                  )}
                  {row.status === 'blocked' && (
                    <DropdownMenuItem onClick={() => handleUnblock(row)}><Shield className="h-4 w-4 mr-2" />Unblock</DropdownMenuItem>
                  )}
                  {row.role !== 'admin' && (
                    <DropdownMenuItem onClick={() => handleChangeRoleClick(row)}><UserCog className="h-4 w-4 mr-2" />Change Role</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Change Role Dialog */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Change User Role</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Role</Label>
            <SearchableCombobox
              options={[
                { value: 'team_member', label: 'Team Member' },
                { value: 'admin', label: 'Admin' },
                { value: 'client', label: 'Client' },
              ]}
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as AppRole)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? 'Saving...' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isBlockOpen} onOpenChange={setIsBlockOpen} title="Block User" description={`Are you sure you want to block ${selectedUser?.name}? They will not be able to access the system.`} confirmLabel="Block" onConfirm={handleBlock} variant="destructive" />
      <ConfirmModal open={isRejectOpen} onOpenChange={setIsRejectOpen} title="Reject User" description={`Are you sure you want to reject ${selectedUser?.name}'s signup request?`} confirmLabel="Reject" onConfirm={handleReject} variant="destructive" />
    </div>
  );
}
