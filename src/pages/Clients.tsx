import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Link as LinkIcon, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, type ClientData } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ClientAccountLinker } from '@/components/admin/ClientAccountLinker';
import { BulkAssignment } from '@/components/assignments/BulkAssignment';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';
import { toast } from '@/hooks/use-toast';

export default function Clients() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [activeTab, setActiveTab] = useState('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showLinker, setShowLinker] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, string>[]) => {
    let successCount = 0;
    const errors: string[] = [];
    
    for (const row of data) {
      try {
        // Normalize client_type - ensure it's one of the valid values
        let clientType = (row.client_type || 'individual').toLowerCase().trim();
        if (!['individual', 'corporate', 'government'].includes(clientType)) {
          clientType = 'individual';
        }
        
        // Normalize status
        let status = (row.status || 'active').toLowerCase().trim();
        if (!['active', 'inactive'].includes(status)) {
          status = 'active';
        }

        await createClient.mutateAsync({
          name: row.name,
          client_type: clientType,
          phone: row.phone || undefined,
          email: row.email || undefined,
          cnic: row.cnic || undefined,
          region: row.region || undefined,
          status: status,
        });
        successCount++;
      } catch (error: any) {
        errors.push(`${row.name}: ${error.message}`);
      }
    }
    
    return { success: successCount, errors };
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    client_type: 'individual',
    phone: '',
    email: '',
    cnic: '',
    region: '',
    status: 'active',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      client_type: 'individual',
      phone: '',
      email: '',
      cnic: '',
      region: '',
      status: 'active',
    });
  };

  const filteredClients = clients.filter((client) =>
    activeTab === 'all' ? true : client.status === activeTab
  );

  const columns: Column<ClientData>[] = [
    {
      key: 'name',
      header: 'Client Name',
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'client_type',
      header: 'Type',
      render: (row) => <span className="capitalize">{row.client_type}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => row.phone || '-',
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email || '-',
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      render: (row) => row.region || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (client: ClientData) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  const handleEdit = (client: ClientData) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      client_type: client.client_type,
      phone: client.phone || '',
      email: client.email || '',
      cnic: client.cnic || '',
      region: client.region || '',
      status: client.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (client: ClientData) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createClient.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    await updateClient.mutateAsync({ id: selectedClient.id, ...formData });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    await deleteClient.mutateAsync(selectedClient.id);
    setIsDeleteOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {isAdmin ? 'Clients' : 'My Clients'}
          </h1>
          <p className="text-muted-foreground">
            Manage your client database
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <BulkAssignment
              type="clients"
              selectedIds={selectedClientIds}
              onComplete={() => setSelectedClientIds([])}
            />
          )}
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowLinker(!showLinker)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              {showLinker ? 'Hide' : 'Link'} Accounts
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        entityType="clients"
        onImport={handleBulkImport}
      />

      {/* Client Account Linker */}
      {isAdmin && showLinker && (
        <ClientAccountLinker />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredClients}
            columns={columns}
            searchPlaceholder="Search clients..."
            searchKey="name"
            title="Clients"
            isLoading={isLoading}
            selectable={isAdmin}
            selectedIds={selectedClientIds}
            onSelectionChange={setSelectedClientIds}
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem onClick={() => navigate(`/clients/${row.id}`)}>
                    <User className="h-4 w-4 mr-2" />
                    360° View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleView(row)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Quick View
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEdit(row)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteClick(row)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.client_type}
                  onValueChange={(value) => setFormData({ ...formData, client_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cnic">CNIC / ID</Label>
                  <Input 
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="region">Region</Label>
                  <Input 
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select 
                  value={formData.client_type}
                  onValueChange={(value) => setFormData({ ...formData, client_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cnic">CNIC / ID</Label>
                  <Input 
                    id="edit-cnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-region">Region</Label>
                  <Input 
                    id="edit-region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                {updateClient.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedClient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedClient.client_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedClient.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedClient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNIC / ID</p>
                  <p className="font-medium">{selectedClient.cnic || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{selectedClient.region || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedClient.status} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Client"
        description={`Are you sure you want to delete ${selectedClient?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
