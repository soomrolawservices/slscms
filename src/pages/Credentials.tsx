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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockClients, getClientById } from '@/data/mockData';
import type { Credential } from '@/types';
import { toast } from '@/hooks/use-toast';

const mockCredentials: Credential[] = [
  {
    id: '1',
    clientId: '1',
    platform: 'Online Filing System',
    url: 'https://courts.gov/filing',
    username: 'acme_legal',
    password: 'SecurePass123!',
    pin: '1234',
  },
  {
    id: '2',
    clientId: '2',
    platform: 'Property Registry',
    url: 'https://property.gov/registry',
    username: 'john_smith_property',
    password: 'PropPass456!',
  },
  {
    id: '3',
    clientId: '5',
    platform: 'Patent Office',
    url: 'https://patents.gov/portal',
    username: 'techsol_patents',
    password: 'PatentSecure789!',
    pin: '5678',
  },
];

export default function Credentials() {
  const [credentials, setCredentials] = useState(mockCredentials);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: Column<Credential>[] = [
    {
      key: 'clientId',
      header: 'Client',
      render: (row) => (
        <span className="font-medium">
          {getClientById(row.clientId)?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
    },
    {
      key: 'url',
      header: 'URL',
      render: (row) => (
        <a 
          href={row.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate block max-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {row.url}
        </a>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (row) => <span className="font-mono text-sm">{row.username}</span>,
    },
    {
      key: 'password',
      header: 'Password',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {visiblePasswords[row.id] ? row.password : '••••••••'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              togglePasswordVisibility(row.id);
            }}
          >
            {visiblePasswords[row.id] ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const handleView = (cred: Credential) => {
    setSelectedCredential(cred);
    setIsViewOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard.`,
    });
  };

  const handleDelete = (cred: Credential) => {
    setCredentials(credentials.filter(c => c.id !== cred.id));
    toast({
      title: 'Credential deleted',
      description: 'The credential has been removed.',
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCredential: Credential = {
      id: String(Date.now()),
      clientId: formData.get('clientId') as string,
      platform: formData.get('platform') as string,
      url: formData.get('url') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      pin: formData.get('pin') as string || undefined,
    };
    setCredentials([newCredential, ...credentials]);
    setIsCreateOpen(false);
    toast({
      title: 'Credential saved',
      description: `Credentials for ${newCredential.platform} have been saved.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Credentials
          </h1>
          <p className="text-muted-foreground">
            Securely store client credentials
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Security Notice */}
      <div className="border-2 border-border bg-muted/50 p-4">
        <p className="text-sm font-medium">🔒 Security Notice</p>
        <p className="text-sm text-muted-foreground">
          Credentials are encrypted and access is logged. Only view when necessary.
        </p>
      </div>

      {/* Table */}
      <DataTable
        data={credentials}
        columns={columns}
        searchPlaceholder="Search credentials..."
        searchKey="platform"
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(row.password, 'Password')}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Password
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

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
            <DialogDescription>
              Store sensitive login credentials securely.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="platform">Platform Name</Label>
                <Input id="platform" name="platform" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" type="url" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pin">PIN / Security Code (optional)</Label>
                <Input id="pin" name="pin" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Credential</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Credential Details</DialogTitle>
          </DialogHeader>
          {selectedCredential && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {getClientById(selectedCredential.clientId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <p className="font-medium">{selectedCredential.platform}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">URL</p>
                  <p className="font-medium break-all">{selectedCredential.url}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{selectedCredential.username}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(selectedCredential.username, 'Username')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Password</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">••••••••</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(selectedCredential.password, 'Password')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {selectedCredential.pin && (
                  <div>
                    <p className="text-sm text-muted-foreground">PIN</p>
                    <p className="font-mono">{selectedCredential.pin}</p>
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
