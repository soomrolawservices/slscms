import { useState } from 'react';
import { Users, Briefcase, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { StatusBadge } from '@/components/ui/status-badge';
import { useClients, useUpdateClient } from '@/hooks/useClients';
import { useCases, useUpdateCase } from '@/hooks/useCases';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Assignments() {
  const { isAdmin } = useAuth();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: cases = [], isLoading: casesLoading } = useCases();
  const { data: users = [] } = useUsers();
  const updateClient = useUpdateClient();
  const updateCase = useUpdateCase();

  const [isAssignClientOpen, setIsAssignClientOpen] = useState(false);
  const [isAssignCaseOpen, setIsAssignCaseOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const teamMembers = users.filter(u => u.status === 'active');
  const userOptions = teamMembers.map(u => ({ 
    value: u.id, 
    label: u.name || u.email || 'Unknown' 
  }));

  const unassignedClients = clients.filter(c => !c.assigned_to);
  const unassignedCases = cases.filter(c => !c.assigned_to);

  const handleAssignClient = async () => {
    if (!selectedClient || !selectedUser) return;
    await updateClient.mutateAsync({ id: selectedClient, assigned_to: selectedUser });
    toast({ title: 'Client assigned successfully' });
    setIsAssignClientOpen(false);
    setSelectedClient('');
    setSelectedUser('');
  };

  const handleAssignCase = async () => {
    if (!selectedCase || !selectedUser) return;
    await updateCase.mutateAsync({ id: selectedCase, assigned_to: selectedUser });
    toast({ title: 'Case assigned successfully' });
    setIsAssignCaseOpen(false);
    setSelectedCase('');
    setSelectedUser('');
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Assignments
          </h1>
          <p className="text-muted-foreground">
            Assign clients and cases to team members
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAssignClientOpen(true)} className="gap-2">
            <Users className="h-4 w-4" />
            Assign Client
          </Button>
          <Button onClick={() => setIsAssignCaseOpen(true)} variant="outline" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Assign Case
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedClients.length}</p>
                <p className="text-sm text-muted-foreground">Unassigned Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Briefcase className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedCases.length}</p>
                <p className="text-sm text-muted-foreground">Unassigned Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <Tabs defaultValue="clients">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Client Assignments</CardTitle>
              <CardDescription>View and manage client assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {clients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No clients found</div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email || client.phone || 'No contact'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{getAssigneeName(client.assigned_to)}</p>
                          <StatusBadge status={client.assigned_to ? 'assigned' : 'unassigned'} variant={client.assigned_to ? 'success' : 'warning'} size="sm" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setSelectedUser(client.assigned_to || '');
                            setIsAssignClientOpen(true);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Case Assignments</CardTitle>
              <CardDescription>View and manage case assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {cases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No cases found</div>
                ) : (
                  cases.map((caseItem) => (
                    <div key={caseItem.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{caseItem.title}</p>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={caseItem.status} size="sm" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{getAssigneeName(caseItem.assigned_to)}</p>
                          <StatusBadge status={caseItem.assigned_to ? 'assigned' : 'unassigned'} variant={caseItem.assigned_to ? 'success' : 'warning'} size="sm" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCase(caseItem.id);
                            setSelectedUser(caseItem.assigned_to || '');
                            setIsAssignCaseOpen(true);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Client Modal */}
      <Dialog open={isAssignClientOpen} onOpenChange={setIsAssignClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Client</DialogTitle>
            <DialogDescription>Select a team member to assign this client to.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <SearchableCombobox
                options={clients.map(c => ({ value: c.id, label: c.name }))}
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Select client..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <SearchableCombobox
                options={userOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Select team member..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignClientOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignClient} disabled={!selectedClient || !selectedUser || updateClient.isPending}>
              {updateClient.isPending ? 'Assigning...' : 'Assign Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Case Modal */}
      <Dialog open={isAssignCaseOpen} onOpenChange={setIsAssignCaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Case</DialogTitle>
            <DialogDescription>Select a team member to assign this case to.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Case</Label>
              <SearchableCombobox
                options={cases.map(c => ({ value: c.id, label: c.title }))}
                value={selectedCase}
                onChange={setSelectedCase}
                placeholder="Select case..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <SearchableCombobox
                options={userOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Select team member..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignCaseOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignCase} disabled={!selectedCase || !selectedUser || updateCase.isPending}>
              {updateCase.isPending ? 'Assigning...' : 'Assign Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}