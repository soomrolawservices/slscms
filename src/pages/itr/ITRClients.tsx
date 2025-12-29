import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Download, FileText, Building2, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useClients } from '@/hooks/useClients';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import {
  useITRFiscalYears,
  useITRReturns,
  useCreateITRReturn,
  useUpdateITRReturn,
  useDeleteITRReturn,
  useITRClientBanks,
  useCreateClientBank,
  useDeleteClientBank,
  useITRBankStatements,
  useUpsertBankStatement,
} from '@/hooks/useITRPortal';
import { exportToPDF } from '@/lib/export-utils';
import { toast } from '@/hooks/use-toast';

const PROGRESS_MAP: Record<string, { label: string; value: number; color: string }> = {
  pending: { label: 'Pending', value: 0, color: 'bg-slate-400' },
  bank_statement_compiled: { label: 'Bank Compiled', value: 50, color: 'bg-amber-500' },
  drafted: { label: 'Drafted', value: 80, color: 'bg-blue-500' },
  discussion: { label: 'Discussion', value: 95, color: 'bg-purple-500' },
  filed: { label: 'Filed', value: 100, color: 'bg-green-500' },
};

const PAYMENT_STATUS_OPTIONS = [
  { value: 'foc', label: 'FOC' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
];

export default function ITRClients() {
  const { data: fiscalYears = [] } = useITRFiscalYears();
  const { data: clients = [] } = useClients();
  const { data: teamMembers = [] } = useTeamMembers();
  const [selectedYear, setSelectedYear] = useState<string>(fiscalYears[0]?.id || '');
  
  const { data: returns = [], isLoading } = useITRReturns(selectedYear);
  const createReturn = useCreateITRReturn();
  const updateReturn = useUpdateITRReturn();
  const deleteReturn = useDeleteITRReturn();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    assigned_to: '',
    title: '',
    progress: 'pending',
    payment_amount: 0,
    payment_status: 'unpaid',
  });

  // Bank statements modal
  const { data: clientBanks = [] } = useITRClientBanks(selectedReturn?.client_id);
  const { data: bankStatements = [] } = useITRBankStatements(selectedReturn?.id);
  const createBank = useCreateClientBank();
  const deleteBank = useDeleteClientBank();
  const upsertStatement = useUpsertBankStatement();
  const [newBankName, setNewBankName] = useState('');
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [selectedClientsForBulk, setSelectedClientsForBulk] = useState<string[]>([]);

  const activeClients = clients.filter(c => c.status === 'active');
  const memberOptions = teamMembers.map(m => ({ value: m.id, label: m.name }));

  // Filter clients not already in returns for this year
  const existingClientIds = returns.map((r: any) => r.client_id);
  const availableClients = activeClients.filter(c => !existingClientIds.includes(c.id));
  const clientOptions = availableClients.map(c => ({ value: c.id, label: c.name }));

  const handleBulkAddClients = async () => {
    if (selectedClientsForBulk.length === 0 || !selectedYear) return;
    
    for (const clientId of selectedClientsForBulk) {
      await createReturn.mutateAsync({
        client_id: clientId,
        fiscal_year_id: selectedYear,
      });
    }
    
    setSelectedClientsForBulk([]);
    setIsBulkAddOpen(false);
    toast({ title: `Added ${selectedClientsForBulk.length} clients` });
  };

  const resetForm = () => {
    setFormData({ client_id: '', assigned_to: '', title: '', progress: 'pending', payment_amount: 0, payment_status: 'unpaid' });
  };

  const columns: Column<any>[] = [
    { key: 'sr', header: 'SR.', render: (row) => returns.indexOf(row) + 1 },
    { key: 'title', header: 'Title', render: (row) => row.title || row.clients?.name || '-' },
    { key: 'year', header: 'Year', render: (row) => row.itr_fiscal_years?.year_label || '-' },
    { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.clients?.client_type}</span> },
    {
      key: 'bank_statement',
      header: 'Bank Statement',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => { setSelectedReturn(row); setIsBankModalOpen(true); }}>
          <Building2 className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => {
        const prog = PROGRESS_MAP[row.progress];
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={prog.value} className="h-2 flex-1" />
            <span className="text-xs font-medium">{prog.value}%</span>
          </div>
        );
      },
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (row) => <span className="font-medium">PKR {(row.payment_amount || 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    { key: 'assigned', header: 'Assigned To', render: (row) => row.profiles?.name || '-' },
  ];

  const handleCreate = async () => {
    if (!formData.client_id || !selectedYear) return;
    await createReturn.mutateAsync({
      client_id: formData.client_id,
      fiscal_year_id: selectedYear,
      assigned_to: formData.assigned_to || undefined,
      title: formData.title || undefined,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (row: any) => {
    setSelectedReturn(row);
    setFormData({
      client_id: row.client_id,
      assigned_to: row.assigned_to || '',
      title: row.title || '',
      progress: row.progress,
      payment_amount: row.payment_amount || 0,
      payment_status: row.payment_status,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedReturn) return;
    await updateReturn.mutateAsync({
      id: selectedReturn.id,
      assigned_to: formData.assigned_to || null,
      title: formData.title || null,
      progress: formData.progress,
      payment_amount: formData.payment_amount,
      payment_status: formData.payment_status,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedReturn) return;
    await deleteReturn.mutateAsync(selectedReturn.id);
    setIsDeleteOpen(false);
  };

  const handleApplyExtension = async (row: any) => {
    await updateReturn.mutateAsync({ id: row.id, has_extension: true, extension_status: 'pending' });
    toast({ title: 'Extension applied' });
  };

  const handleExportInvoice = (row: any) => {
    const yearLabel = row.itr_fiscal_years?.year_label || 'FY25';
    const data = [{
      description: `Income Tax Return Filed - ${yearLabel}`,
      amount: `PKR ${(row.payment_amount || 0).toLocaleString()}`,
      client: row.clients?.name || 'Client',
      status: row.payment_status,
    }];
    exportToPDF(data, [
      { key: 'description', header: 'Description' },
      { key: 'amount', header: 'Amount' },
      { key: 'client', header: 'Client' },
      { key: 'status', header: 'Status' },
    ], `itr-invoice-${row.clients?.name}`, `ITR Invoice - ${yearLabel}`);
  };

  const handleAddBank = async () => {
    if (!newBankName || !selectedReturn?.client_id) return;
    await createBank.mutateAsync({ client_id: selectedReturn.client_id, bank_name: newBankName });
    setNewBankName('');
  };

  const handleStatementStatusChange = async (bankId: string, status: string) => {
    if (!selectedReturn) return;
    await upsertStatement.mutateAsync({ return_id: selectedReturn.id, bank_id: bankId, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">ITR Clients</h1>
          <p className="text-muted-foreground">Manage income tax return filings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkAddOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Add Clients
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client Return
          </Button>
        </div>
      </div>

      <Tabs value={selectedYear} onValueChange={setSelectedYear}>
        <TabsList className="border-2 border-border">
          {fiscalYears.map(fy => (
            <TabsTrigger key={fy.id} value={fy.id}>{fy.year_label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedYear} className="mt-4">
          <DataTable
            data={returns}
            columns={columns}
            searchPlaceholder="Search clients..."
            searchKey="title"
            title="ITR Clients"
            isLoading={isLoading}
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem onClick={() => handleEdit(row)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleApplyExtension(row)}><FileText className="h-4 w-4 mr-2" />Apply Extension</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportInvoice(row)}><Download className="h-4 w-4 mr-2" />Export Invoice</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedReturn(row); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Add Client Return</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(v) => setFormData({ ...formData, client_id: v })} placeholder="Select client..." />
            </div>
            <div className="grid gap-2">
              <Label>Title (optional)</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <SearchableCombobox options={memberOptions} value={formData.assigned_to} onChange={(v) => setFormData({ ...formData, assigned_to: v })} placeholder="Select member..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createReturn.isPending || !formData.client_id}>
              {createReturn.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Edit ITR Return</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Progress</Label>
              <SearchableCombobox
                options={Object.entries(PROGRESS_MAP).map(([k, v]) => ({ value: k, label: `${v.label} (${v.value}%)` }))}
                value={formData.progress}
                onChange={(v) => setFormData({ ...formData, progress: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Payment Amount</Label>
                <Input type="number" min="0" value={formData.payment_amount} onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Payment Status</Label>
                <SearchableCombobox options={PAYMENT_STATUS_OPTIONS} value={formData.payment_status} onChange={(v) => setFormData({ ...formData, payment_status: v })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <SearchableCombobox options={memberOptions} value={formData.assigned_to} onChange={(v) => setFormData({ ...formData, assigned_to: v })} placeholder="Select member..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateReturn.isPending}>
              {updateReturn.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Statements Modal */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="border-2 border-border max-w-2xl">
          <DialogHeader><DialogTitle>Bank Statements - {selectedReturn?.clients?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Bank name..." value={newBankName} onChange={(e) => setNewBankName(e.target.value)} />
              <Button onClick={handleAddBank} disabled={!newBankName || createBank.isPending}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>

            <div className="border-2 border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">SR.</th>
                    <th className="px-4 py-2 text-left">Bank Name</th>
                    <th className="px-4 py-2 text-left">Upload</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientBanks.map((bank: any, idx: number) => {
                    const statement = bankStatements.find((s: any) => s.bank_id === bank.id);
                    return (
                      <tr key={bank.id} className="border-t border-border">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{bank.bank_name}</td>
                        <td className="px-4 py-2">
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" />Upload
                          </Button>
                        </td>
                        <td className="px-4 py-2">
                          <SearchableCombobox
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'working', label: 'Working' },
                              { value: 'compiled', label: 'Compiled' },
                            ]}
                            value={statement?.status || 'pending'}
                            onChange={(v) => handleStatementStatusChange(bank.id, v)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBank.mutate({ id: bank.id, clientId: bank.client_id })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {clientBanks.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No banks added yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsBankModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Delete ITR Return" description="This will permanently delete this ITR return record." confirmLabel="Delete" onConfirm={handleDelete} variant="destructive" />

      {/* Bulk Add Clients Modal */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent className="border-2 border-border max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk Add Clients</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              Select active clients to add to this fiscal year's ITR returns.
            </p>
            {availableClients.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">All active clients are already added for this year.</p>
            ) : (
              <div className="border-2 border-border rounded-lg divide-y divide-border max-h-[400px] overflow-y-auto">
                {availableClients.map((client) => (
                  <label key={client.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClientsForBulk.includes(client.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClientsForBulk([...selectedClientsForBulk, client.id]);
                        } else {
                          setSelectedClientsForBulk(selectedClientsForBulk.filter(id => id !== client.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{client.client_type}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClientsForBulk(availableClients.map(c => c.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClientsForBulk([])}
              >
                Clear
              </Button>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedClientsForBulk.length} selected
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAddClients} disabled={selectedClientsForBulk.length === 0 || createReturn.isPending}>
              {createReturn.isPending ? 'Adding...' : `Add ${selectedClientsForBulk.length} Clients`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
