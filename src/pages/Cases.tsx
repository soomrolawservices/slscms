import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockCases, mockClients, getClientById } from '@/data/mockData';
import type { Case } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Cases() {
  const { isAdmin } = useAuth();
  const [cases, setCases] = useState(mockCases);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const filteredCases = cases.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'archived') return c.status === 'archived';
    return c.status !== 'archived' && c.status !== 'closed';
  });

  const columns: Column<Case>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (row) => <span className="font-mono text-sm">{row.id}</span>,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'clientId',
      header: 'Client',
      render: (row) => {
        const client = getClientById(row.clientId);
        return <span>{client?.name || 'Unknown'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      render: (row) => format(row.updatedAt, 'MMM d, yyyy'),
    },
  ];

  const handleView = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsViewOpen(true);
  };

  const handleDelete = (caseItem: Case) => {
    setCases(cases.filter((c) => c.id !== caseItem.id));
    toast({
      title: 'Case deleted',
      description: `${caseItem.id} has been removed.`,
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCase: Case = {
      id: `CASE-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`,
      title: formData.get('title') as string,
      clientId: formData.get('clientId') as string,
      status: 'open',
      assignedMembers: [],
      description: formData.get('description') as string,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCases([newCase, ...cases]);
    setIsCreateOpen(false);
    toast({
      title: 'Case created',
      description: `${newCase.id} has been created.`,
    });
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
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

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
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(row)}
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
                <Input id="title" name="title" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border">
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Case</Button>
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
                  <p className="font-mono font-medium">{selectedCase.id}</p>
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
                  <p className="font-medium">
                    {getClientById(selectedCase.clientId)?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(selectedCase.createdAt, 'MMM d, yyyy')}
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
    </div>
  );
}
