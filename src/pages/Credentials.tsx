import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, EyeOff, Pencil, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useCredentials, useCreateCredential, useUpdateCredential, useDeleteCredential } from '@/hooks/useCredentials';
import { useClients } from '@/hooks/useClients';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { toast } from '@/hooks/use-toast';

interface CredentialWithClient {
  id: string;
  client_id: string;
  platform_name: string;
  url: string | null;
  username: string | null;
  password_encrypted: string | null;
  pin_code: string | null;
  created_by: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

export default function Credentials() {
  const { data: credentials = [], isLoading } = useCredentials();
  const { data: clients = [] } = useClients();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const deleteCredential = useDeleteCredential();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CredentialWithClient | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    client_id: '',
    platform_name: '',
    url: '',
    username: '',
    password_encrypted: '',
    pin_code: '',
  });

  const resetForm = () => {
    setFormData({ client_id: '', platform_name: '', url: '', username: '', password_encrypted: '', pin_code: '' });
  };

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: Column<CredentialWithClient>[] = [
    {
      key: 'client_id',
      header: 'Client',
      render: (row) => <span className="font-medium">{row.clients?.name || 'Unknown'}</span>,
    },
    {
      key: 'platform_name',
      header: 'Platform',
    },
    {
      key: 'url',
      header: 'URL',
      render: (row) => row.url ? (
        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[200px]" onClick={(e) => e.stopPropagation()}>
          {row.url}
        </a>
      ) : '-',
    },
    {
      key: 'username',
      header: 'Username',
      render: (row) => <span className="font-mono text-sm">{row.username || '-'}</span>,
    },
    {
      key: 'password_encrypted',
      header: 'Password',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{visiblePasswords[row.id] ? row.password_encrypted || '' : '••••••••'}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(row.id); }}>
            {visiblePasswords[row.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      ),
    },
  ];

  const handleView = (cred: CredentialWithClient) => {
    setSelectedCredential(cred);
    setIsViewOpen(true);
  };

  const handleEdit = (cred: CredentialWithClient) => {
    setSelectedCredential(cred);
    setFormData({
      client_id: cred.client_id,
      platform_name: cred.platform_name,
      url: cred.url || '',
      username: cred.username || '',
      password_encrypted: cred.password_encrypted || '',
      pin_code: cred.pin_code || '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (cred: CredentialWithClient) => {
    setSelectedCredential(cred);
    setIsDeleteOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCredential.mutateAsync({
      client_id: formData.client_id,
      platform_name: formData.platform_name,
      url: formData.url || undefined,
      username: formData.username || undefined,
      password_encrypted: formData.password_encrypted || undefined,
      pin_code: formData.pin_code || undefined,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredential) return;
    await updateCredential.mutateAsync({
      id: selectedCredential.id,
      client_id: formData.client_id,
      platform_name: formData.platform_name,
      url: formData.url || null,
      username: formData.username || null,
      password_encrypted: formData.password_encrypted || null,
      pin_code: formData.pin_code || null,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedCredential) return;
    await deleteCredential.mutateAsync(selectedCredential.id);
    setIsDeleteOpen(false);
    setSelectedCredential(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">Securely store client credentials</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      <div className="border-2 border-border bg-muted/50 p-4">
        <p className="text-sm font-medium">🔒 Security Notice</p>
        <p className="text-sm text-muted-foreground">Credentials are encrypted and access is logged. Only view when necessary.</p>
      </div>

      <DataTable
        data={credentials as CredentialWithClient[]}
        columns={columns}
        searchPlaceholder="Search credentials..."
        searchKey="platform_name"
        title="Credentials"
        isLoading={isLoading}
        actions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
              <DropdownMenuItem onClick={() => handleView(row)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(row.password_encrypted || '', 'Password')}><Copy className="h-4 w-4 mr-2" />Copy Password</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(row)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(row)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Add Credential</DialogTitle><DialogDescription>Store sensitive login credentials securely.</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Client</Label><SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." /></div>
              <div className="grid gap-2"><Label htmlFor="platform_name">Platform Name</Label><Input id="platform_name" value={formData.platform_name} onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })} required /></div>
              <div className="grid gap-2"><Label htmlFor="url">URL</Label><Input id="url" type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="username">Username</Label><Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password_encrypted} onChange={(e) => setFormData({ ...formData, password_encrypted: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="pin_code">PIN / Security Code (optional)</Label><Input id="pin_code" value={formData.pin_code} onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createCredential.isPending || !formData.client_id}>{createCredential.isPending ? 'Saving...' : 'Save Credential'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Edit Credential</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Client</Label><SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." /></div>
              <div className="grid gap-2"><Label htmlFor="edit-platform_name">Platform Name</Label><Input id="edit-platform_name" value={formData.platform_name} onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-url">URL</Label><Input id="edit-url" type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-username">Username</Label><Input id="edit-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-password">Password</Label><Input id="edit-password" type="password" value={formData.password_encrypted} onChange={(e) => setFormData({ ...formData, password_encrypted: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-pin_code">PIN / Security Code</Label><Input id="edit-pin_code" value={formData.pin_code} onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button type="submit" disabled={updateCredential.isPending}>{updateCredential.isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Credential Details</DialogTitle></DialogHeader>
          {selectedCredential && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium">{selectedCredential.clients?.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Platform</p><p className="font-medium">{selectedCredential.platform_name}</p></div>
                <div className="col-span-2"><p className="text-sm text-muted-foreground">URL</p><p className="font-medium break-all">{selectedCredential.url || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Username</p><div className="flex items-center gap-2"><p className="font-mono">{selectedCredential.username || '-'}</p>{selectedCredential.username && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedCredential.username!, 'Username')}><Copy className="h-3 w-3" /></Button>}</div></div>
                <div><p className="text-sm text-muted-foreground">Password</p><div className="flex items-center gap-2"><p className="font-mono">••••••••</p><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedCredential.password_encrypted || '', 'Password')}><Copy className="h-3 w-3" /></Button></div></div>
                {selectedCredential.pin_code && <div><p className="text-sm text-muted-foreground">PIN</p><p className="font-mono">{selectedCredential.pin_code}</p></div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Delete Credential" description="Are you sure you want to delete this credential?" confirmLabel="Delete" onConfirm={handleDelete} variant="destructive" />
    </div>
  );
}
