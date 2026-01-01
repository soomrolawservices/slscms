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
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';
import { format } from 'date-fns';

interface PaymentWithRelations {
  id: string;
  payment_id: string;
  title: string;
  amount: number;
  client_id: string;
  case_id: string | null;
  payment_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  clients?: { name: string } | null;
  cases?: { title: string } | null;
}

export default function Payments() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, string>[]) => {
    let successCount = 0;
    const errors: string[] = [];
    
    for (const row of data) {
      try {
        const clientName = row.client_name || row.client;
        const client = clients.find(c => c.name.toLowerCase() === clientName?.toLowerCase());
        if (!client) {
          errors.push(`${row.title}: Client "${clientName}" not found`);
          continue;
        }
        
        let status = (row.status || 'pending').toLowerCase().trim();
        if (!['pending', 'completed', 'failed'].includes(status)) {
          status = 'pending';
        }

        const caseTitle = row.case_title || row.case;
        const caseItem = caseTitle ? (cases as any[]).find(c => c.title?.toLowerCase() === caseTitle?.toLowerCase()) : null;

        await createPayment.mutateAsync({
          title: row.title,
          amount: parseFloat(row.amount) || 0,
          client_id: client.id,
          case_id: caseItem?.id,
          payment_date: row.payment_date || row.date,
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
    amount: 0,
    client_id: '',
    case_id: '',
    payment_date: '',
    status: 'pending',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: 0,
      client_id: '',
      case_id: '',
      payment_date: '',
      status: 'pending',
    });
  };

  const filteredPayments = (payments as PaymentWithRelations[]).filter((p) =>
    activeTab === 'all' ? true : p.status === activeTab
  );

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const caseOptions = (cases as { id: string; title: string }[]).map((c) => ({ value: c.id, label: c.title }));

  const columns: Column<PaymentWithRelations>[] = [
    {
      key: 'payment_id',
      header: 'Payment ID',
      render: (row) => <span className="font-mono text-sm">{row.payment_id}</span>,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-bold">PKR {row.amount.toLocaleString()}</span>,
    },
    {
      key: 'client_id',
      header: 'Client',
      render: (row) => row.clients?.name || 'Unknown',
    },
    {
      key: 'case_id',
      header: 'Case',
      render: (row) => row.cases?.title || '-',
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
      render: (row) => row.payment_date ? format(new Date(row.payment_date), 'MMM d, yyyy') : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsViewOpen(true);
  };

  const handleEdit = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setFormData({
      title: payment.title,
      amount: payment.amount,
      client_id: payment.client_id,
      case_id: payment.case_id || '',
      payment_date: payment.payment_date?.split('T')[0] || '',
      status: payment.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayment.mutateAsync({
      title: formData.title,
      amount: formData.amount,
      client_id: formData.client_id,
      case_id: formData.case_id || undefined,
      payment_date: formData.payment_date || undefined,
      status: formData.status,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    await updatePayment.mutateAsync({
      id: selectedPayment.id,
      title: formData.title,
      amount: formData.amount,
      client_id: formData.client_id,
      case_id: formData.case_id || null,
      payment_date: formData.payment_date || null,
      status: formData.status,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    await deletePayment.mutateAsync(selectedPayment.id);
    setIsDeleteOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track payment records and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        entityType="payments"
        onImport={handleBulkImport}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredPayments}
            columns={columns}
            searchPlaceholder="Search payments..."
            searchKey="title"
            title="Payments"
            isLoading={isLoading}
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
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(row)}>
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
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter the payment details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input id="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." />
              </div>
              <div className="grid gap-2">
                <Label>Case (optional)</Label>
                <SearchableCombobox options={caseOptions} value={formData.case_id} onChange={(value) => setFormData({ ...formData, case_id: value })} placeholder="Select case..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input id="payment_date" type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <SearchableCombobox options={[{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]} value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createPayment.isPending || !formData.client_id}>{createPayment.isPending ? 'Recording...' : 'Record Payment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount (PKR)</Label>
                <Input id="edit-amount" type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <SearchableCombobox options={[{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]} value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updatePayment.isPending}>{updatePayment.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
          {selectedPayment && (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Payment ID</p><p className="font-mono font-medium">{selectedPayment.payment_id}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedPayment.status} /></div>
              <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{selectedPayment.title}</p></div>
              <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-bold">PKR {selectedPayment.amount.toLocaleString()}</p></div>
              <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium">{selectedPayment.clients?.name || 'Unknown'}</p></div>
              <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{selectedPayment.payment_date ? format(new Date(selectedPayment.payment_date), 'MMM d, yyyy') : '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Delete Payment" description="Are you sure you want to delete this payment?" confirmLabel="Delete" onConfirm={handleDelete} variant="destructive" />
    </div>
  );
}
