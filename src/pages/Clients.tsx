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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockClients } from '@/data/mockData';
import type { Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Clients() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState(mockClients);
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter((client) =>
    activeTab === 'all' ? true : client.status === activeTab
  );

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Client Name',
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClients(clients.filter((c) => c.id !== client.id));
    toast({
      title: 'Client deleted',
      description: `${client.name} has been removed.`,
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient: Client = {
      id: String(Date.now()),
      name: formData.get('name') as string,
      type: formData.get('type') as Client['type'],
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      cnic: formData.get('cnic') as string,
      region: formData.get('region') as string,
      status: 'active',
      createdAt: new Date(),
    };
    setClients([newClient, ...clients]);
    setIsCreateOpen(false);
    toast({
      title: 'Client created',
      description: `${newClient.name} has been added.`,
    });
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
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

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
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" required>
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
                  <Input id="phone" name="phone" type="tel" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cnic">CNIC / ID</Label>
                  <Input id="cnic" name="cnic" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Client</Button>
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
                  <p className="font-medium capitalize">{selectedClient.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedClient.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNIC / ID</p>
                  <p className="font-medium">{selectedClient.cnic}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{selectedClient.region}</p>
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
    </div>
  );
}
