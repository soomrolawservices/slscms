import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useCases, useCreateCase, useUpdateCase, useDeleteCase } from '@/hooks/useCases';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { BulkAssignment } from '@/components/assignments/BulkAssignment';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';
import { format } from 'date-fns';

interface CaseWithClient {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  status: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string } | null;
}

export default function Cases() {
  const { isAdmin } = useAuth();
  const { data: cases = [], isLoading } = useCases();
  const { data: clients = [] } = useClients();
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const deleteCase = useDeleteCase();

  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithClient | null>(null);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, string>[]) => {
    let successCount = 0;
    const errors: string[] = [];
    
    for (const row of data) {
      try {
        // Try to find client by name (case-insensitive)
        const clientName = row.client_name || row.client;
        const client = clients.find(c => c.name.toLowerCase() === clientName?.toLowerCase());
        if (!client) {
          errors.push(`${row.title}: Client "${clientName}" not found`);
          continue;
        }
        
        // Normalize status
        let status = (row.status || 'active').toLowerCase().trim();
        if (!['active', 'in_progress', 'pending', 'closed', 'archived', 'open'].includes(status)) {
          status = 'active';
        }
        // Map 'open' to 'active' for compatibility
        if (status === 'open') status = 'active';

        await createCase.mutateAsync({
          title: row.title,
          description: row.description || undefined,
          client_id: client.id,
          status: status,
        });
        successCount++;
      } catch (error: any) {
        errors.push(`${row.title}: ${error.message}`);
      }
    }
    
    return { success: successCount, errors };
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    status: 'active',
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', client_id: '', status: 'active' });
  };

  const filteredCases = (cases as CaseWithClient[]).filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'archived') return c.status === 'archived';
    return c.status !== 'archived' && c.status !== 'closed';
  });

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  const columns: Column<CaseWithClient>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (row) => <span className="font-mono text-sm">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'client_id',
      header: 'Client',
      render: (row) => row.clients?.name || 'Unknown',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      render: (row) => format(new Date(row.updated_at), 'MMM d, yyyy'),
    },
  ];

  const handleView = (caseItem: CaseWithClient) => {
    setSelectedCase(caseItem);
    setIsViewOpen(true);
  };

  const handleEdit = (caseItem: CaseWithClient) => {
    setSelectedCase(caseItem);
    setFormData({
      title: caseItem.title,
      description: caseItem.description || '',
      client_id: caseItem.client_id,
      status: caseItem.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (caseItem: CaseWithClient) => {
    setSelectedCase(caseItem);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCase.mutateAsync({
      title: formData.title,
      description: formData.description || undefined,
      client_id: formData.client_id,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    await updateCase.mutateAsync({
      id: selectedCase.id,
      title: formData.title,
      description: formData.description || null,
      client_id: formData.client_id,
      status: formData.status,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    await deleteCase.mutateAsync(selectedCase.id);
    setIsDeleteOpen(false);
    setSelectedCase(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {isAdmin ? 'Cases' : 'My Cases'}
          </h1>
          <p className="text-muted-foreground">
            Manage legal cases and matters
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <BulkAssignment
              type="cases"
              selectedIds={selectedCaseIds}
              onComplete={() => setSelectedCaseIds([])}
            />
          )}
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        entityType="cases"
        onImport={handleBulkImport}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredCases}
            columns={columns}
            searchPlaceholder="Search cases..."
            searchKey="title"
            title="Cases"
            isLoading={isLoading}
            selectable={isAdmin}
            selectedIds={selectedCaseIds}
            onSelectionChange={setSelectedCaseIds}
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem onClick={() => handleView(row)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
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
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Enter the case details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Case Title</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={(value) => setFormData({ ...formData, client_id: value })}
                  placeholder="Select client..."
                  searchPlaceholder="Search clients..."
                  emptyText="No clients found."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCase.isPending || !formData.client_id}>
                {createCase.isPending ? 'Creating...' : 'Create Case'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
            <DialogDescription>
              Update the case details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Case Title</Label>
                <Input 
                  id="edit-title" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={(value) => setFormData({ ...formData, client_id: value })}
                  placeholder="Select client..."
                  searchPlaceholder="Search clients..."
                  emptyText="No clients found."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <SearchableCombobox
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'closed', label: 'Closed' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  placeholder="Select status..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCase.isPending}>
                {updateCase.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Case ID</p>
                  <p className="font-mono font-medium">{selectedCase.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedCase.status} />
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedCase.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedCase.clients?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedCase.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {selectedCase.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{selectedCase.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Case"
        description={`Are you sure you want to delete this case? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
