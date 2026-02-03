import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Eye, Trash2, Download, Printer, Upload, FileText } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices';
import { useInvoiceLineItems, useCreateLineItems, LineItem } from '@/hooks/useInvoiceLineItems';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { InvoiceLineItemsEditor } from '@/components/invoice/InvoiceLineItemsEditor';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';
import { exportToPDF } from '@/lib/export-utils';
import { generateInvoicePDF } from '@/components/invoice/InvoicePDF';
import { generateClientInvoicePDF } from '@/components/invoice/InvoiceTemplate';
import { PinGate } from '@/components/security/PinGate';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceWithRelations {
  id: string;
  invoice_id: string;
  amount: number;
  client_id: string;
  case_id: string | null;
  due_date: string | null;
  status: string;
  payment_id: string | null;
  created_by: string | null;
  created_at: string;
  clients?: { name: string } | null;
  cases?: { title: string } | null;
}

export default function Invoices() {
  const { isAdmin } = useAuth();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const createLineItems = useCreateLineItems();

  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    due_date: '',
    status: 'unpaid',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  // Fetch line items when viewing/editing an invoice
  const { data: existingLineItems = [] } = useInvoiceLineItems(selectedInvoice?.id);

  useEffect(() => {
    if (existingLineItems.length > 0 && (isEditOpen || isViewOpen)) {
      setLineItems(existingLineItems);
    }
  }, [existingLineItems, isEditOpen, isViewOpen]);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const resetForm = () => {
    setFormData({ client_id: '', case_id: '', due_date: '', status: 'unpaid' });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const filteredInvoices = (invoices as InvoiceWithRelations[]).filter((inv) =>
    activeTab === 'all' ? true : inv.status === activeTab
  );

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const caseOptions = (cases as { id: string; title: string }[]).map((c) => ({ value: c.id, label: c.title }));

  const handleInlineUpdate = async (id: string, key: string, value: string) => {
    if (key === 'amount') {
      await updateInvoice.mutateAsync({ id, [key]: parseFloat(value) || 0 });
    } else {
      await updateInvoice.mutateAsync({ id, [key]: value });
    }
  };

  const columns: EditableColumn<InvoiceWithRelations>[] = [
    {
      key: 'invoice_id',
      header: 'Invoice ID',
      render: (row) => <span className="font-mono text-sm">{row.invoice_id}</span>,
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
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row) => row.due_date ? format(new Date(row.due_date), 'MMM d, yyyy') : '-',
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'status',
      options: [
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'partial', label: 'Partial' },
      ],
    },
  ];

  const handleView = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setIsViewOpen(true);
  };

  const handleEdit = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setFormData({
      client_id: invoice.client_id,
      case_id: invoice.case_id || '',
      due_date: invoice.due_date?.split('T')[0] || '',
      status: invoice.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setIsDeleteOpen(true);
  };

  const handleExportPDF = (invoice: InvoiceWithRelations) => {
    const invoiceData = [{
      invoice_id: invoice.invoice_id,
      client: invoice.clients?.name || 'Unknown',
      amount: `PKR ${invoice.amount.toLocaleString()}`,
      due_date: invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-',
      status: invoice.status,
    }];
    exportToPDF(
      invoiceData,
      [
        { key: 'invoice_id', header: 'Invoice ID' },
        { key: 'client', header: 'Client' },
        { key: 'amount', header: 'Amount' },
        { key: 'due_date', header: 'Due Date' },
        { key: 'status', header: 'Status' },
      ],
      `invoice-${invoice.invoice_id}`,
      `Invoice ${invoice.invoice_id}`
    );
    toast({ title: 'Exporting PDF', description: `Downloading ${invoice.invoice_id}.pdf` });
  };

  const handlePrintInvoice = async (invoice: InvoiceWithRelations) => {
    const client = clients.find(c => c.id === invoice.client_id);
    const caseData = (cases as { id: string; title: string }[]).find(c => c.id === invoice.case_id);
    
    await generateInvoicePDF({
      invoice_id: invoice.invoice_id,
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      client: client ? {
        name: client.name,
        email: client.email || undefined,
        phone: client.phone || undefined,
        cnic: client.cnic || undefined,
      } : undefined,
      case: caseData ? { title: caseData.title } : undefined,
    });
  };

  const handleClientDownload = async (invoice: InvoiceWithRelations) => {
    const client = clients.find(c => c.id === invoice.client_id);
    const caseData = (cases as { id: string; title: string }[]).find(c => c.id === invoice.case_id);
    
    await generateClientInvoicePDF({
      invoice_id: invoice.invoice_id,
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      client: client ? {
        name: client.name,
        email: client.email || undefined,
        phone: client.phone || undefined,
        cnic: client.cnic || undefined,
      } : undefined,
      case: caseData ? { title: caseData.title } : undefined,
      line_items: existingLineItems.length > 0 ? existingLineItems : undefined,
    });
    toast({ title: 'Opening Invoice', description: 'Client invoice PDF opened in new tab' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0 || !lineItems.some(item => item.description && item.amount > 0)) {
      toast({ title: 'Add at least one line item', variant: 'destructive' });
      return;
    }

    const result = await createInvoice.mutateAsync({
      amount: totalAmount,
      client_id: formData.client_id,
      case_id: formData.case_id || undefined,
      due_date: formData.due_date || undefined,
    });

    // Save line items
    if (result?.id) {
      await createLineItems.mutateAsync({
        invoiceId: result.id,
        items: lineItems.filter(item => item.description && item.amount > 0),
      });
    }

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    await updateInvoice.mutateAsync({
      id: selectedInvoice.id,
      amount: totalAmount,
      client_id: formData.client_id,
      case_id: formData.case_id || null,
      due_date: formData.due_date || null,
      status: formData.status,
    });

    // Update line items
    await createLineItems.mutateAsync({
      invoiceId: selectedInvoice.id,
      items: lineItems.filter(item => item.description && item.amount > 0),
    });

    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    await deleteInvoice.mutateAsync(selectedInvoice.id);
    setIsDeleteOpen(false);
    setSelectedInvoice(null);
  };

  const handleBulkImport = async (data: Record<string, string>[]) => {
    let success = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const client = clients.find(c => c.name.toLowerCase() === row.client_name?.toLowerCase());
        if (!client) {
          errors.push(`Row ${data.indexOf(row) + 1}: Client "${row.client_name}" not found`);
          continue;
        }

        const amount = parseFloat(row.amount) || 0;
        if (amount <= 0) {
          errors.push(`Row ${data.indexOf(row) + 1}: Invalid amount`);
          continue;
        }

        // Normalize status
        let status = (row.status || 'unpaid').toLowerCase().trim();
        if (!['unpaid', 'paid', 'overdue', 'partial'].includes(status)) {
          status = 'unpaid';
        }

        const result = await createInvoice.mutateAsync({
          amount,
          client_id: client.id,
          due_date: row.due_date || undefined,
          status: status,
        });

        // Parse line items if provided (format: "desc1:amt1;desc2:amt2")
        if (row.line_items && result?.id) {
          const items = row.line_items.split(';').map(item => {
            const [desc, amt] = item.split(':');
            const amount = parseFloat(amt) || 0;
            return { description: desc, quantity: 1, unit_price: amount, amount };
          }).filter(item => item.description && item.amount > 0);

          if (items.length > 0) {
            await createLineItems.mutateAsync({ invoiceId: result.id, items });
          }
        }

        success++;
      } catch (error) {
        errors.push(`Row ${data.indexOf(row) + 1}: ${(error as Error).message}`);
      }
    }

    return { success, errors };
  };

  return (
    <PinGate title="Invoices" description="Manage billing and invoices">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-24">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage billing and invoices</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          )}
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <EditableDataTable
            data={filteredInvoices}
            columns={columns}
            searchPlaceholder="Search invoices..."
            searchKey="invoice_id"
            title="Invoices"
            isLoading={isLoading}
            onUpdate={handleInlineUpdate}
            isUpdating={updateInvoice.isPending}
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem onClick={() => handleView(row)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleClientDownload(row)}><FileText className="h-4 w-4 mr-2" />Client Invoice</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintInvoice(row)}><Printer className="h-4 w-4 mr-2" />Print Invoice</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(row)}><Download className="h-4 w-4 mr-2" />Export PDF</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(row)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle><DialogDescription>Add line items and invoice details.</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Client</Label><SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." /></div>
                <div className="grid gap-2"><Label>Case (optional)</Label><SearchableCombobox options={caseOptions} value={formData.case_id} onChange={(value) => setFormData({ ...formData, case_id: value })} placeholder="Select case..." /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="due_date">Due Date</Label><Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
              
              <InvoiceLineItemsEditor items={lineItems} onChange={setLineItems} />
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createInvoice.isPending || !formData.client_id}>{createInvoice.isPending ? 'Creating...' : `Create Invoice (PKR ${totalAmount.toLocaleString()})`}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Client</Label><SearchableCombobox options={clientOptions} value={formData.client_id} onChange={(value) => setFormData({ ...formData, client_id: value })} placeholder="Select client..." /></div>
                <div className="grid gap-2"><Label>Status</Label><SearchableCombobox options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }, { value: 'partial', label: 'Partial' }]} value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-due_date">Due Date</Label><Input id="edit-due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>

              <InvoiceLineItemsEditor items={lineItems} onChange={setLineItems} />
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button type="submit" disabled={updateInvoice.isPending}>{updateInvoice.isPending ? 'Saving...' : `Save Changes (PKR ${totalAmount.toLocaleString()})`}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border max-w-2xl">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Invoice ID</p><p className="font-mono font-medium">{selectedInvoice.invoice_id}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedInvoice.status} /></div>
                <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-bold">PKR {selectedInvoice.amount.toLocaleString()}</p></div>
                <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium">{selectedInvoice.clients?.name || 'Unknown'}</p></div>
                <div><p className="text-sm text-muted-foreground">Case</p><p className="font-medium">{selectedInvoice.cases?.title || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Due Date</p><p className="font-medium">{selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), 'MMM d, yyyy') : '-'}</p></div>
              </div>

              {existingLineItems.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-2">Line Items</p>
                  <div className="space-y-2">
                    {existingLineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.description} (x{item.quantity})</span>
                        <span className="font-medium">PKR {item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Delete Invoice" description="Are you sure you want to delete this invoice?" confirmLabel="Delete" onConfirm={handleDelete} variant="destructive" />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityType="invoices"
        onImport={handleBulkImport}
      />
    </div>
    </PinGate>
  );
}
