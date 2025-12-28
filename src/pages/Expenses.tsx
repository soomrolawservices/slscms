import { useState, useRef } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Upload, FileImage } from 'lucide-react';
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
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useUploadReceipt, type ExpenseData } from '@/hooks/useExpenses';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'legal_fees', label: 'Legal Fees' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
];

export default function Expenses() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const uploadReceipt = useUploadReceipt();

  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: '',
    status: 'pending',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: '',
      status: 'pending',
    });
    setReceiptFile(null);
  };

  const filteredExpenses = expenses.filter((e) =>
    activeTab === 'all' ? true : e.status === activeTab
  );

  const columns: Column<ExpenseData>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => format(new Date(row.date), 'MMM d, yyyy'),
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
      render: (row) => <span className="font-bold">${Number(row.amount).toLocaleString()}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === row.category);
        return cat?.label || row.category || '-';
      },
    },
    {
      key: 'receipt_path',
      header: 'Receipt',
      render: (row) => row.receipt_path ? (
        <a href={row.receipt_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
          <FileImage className="h-4 w-4" />
          View
        </a>
      ) : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setIsViewOpen(true);
  };

  const handleEdit = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      amount: Number(expense.amount),
      date: expense.date.split('T')[0],
      category: expense.category || '',
      status: expense.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let receiptPath: string | undefined;
    
    // Create expense first to get ID for receipt upload
    const result = await createExpense.mutateAsync({
      title: formData.title,
      amount: formData.amount,
      date: formData.date,
      category: formData.category || undefined,
      status: formData.status,
    });

    // Upload receipt if provided
    if (receiptFile && result?.id) {
      receiptPath = await uploadReceipt.mutateAsync({ file: receiptFile, expenseId: result.id });
      await updateExpense.mutateAsync({ id: result.id, receipt_path: receiptPath });
    }

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    let receiptPath = selectedExpense.receipt_path;

    // Upload new receipt if provided
    if (receiptFile) {
      receiptPath = await uploadReceipt.mutateAsync({ file: receiptFile, expenseId: selectedExpense.id });
    }

    await updateExpense.mutateAsync({
      id: selectedExpense.id,
      title: formData.title,
      amount: formData.amount,
      date: formData.date,
      category: formData.category || null,
      status: formData.status,
      receipt_path: receiptPath,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    await deleteExpense.mutateAsync(selectedExpense.id);
    setIsDeleteOpen(false);
    setSelectedExpense(null);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
  const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track internal firm expenses and receipts</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">${pendingExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-green-600">${approvedExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredExpenses}
            columns={columns}
            searchPlaceholder="Search expenses..."
            searchKey="title"
            title="Expenses"
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
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Enter the expense details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <SearchableCombobox options={EXPENSE_CATEGORIES} value={formData.category} onChange={(value) => setFormData({ ...formData, category: value })} placeholder="Select category..." />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <SearchableCombobox options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} />
              </div>
              <div className="grid gap-2">
                <Label>Receipt (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    {receiptFile ? receiptFile.name : 'Upload Receipt'}
                  </Button>
                  {receiptFile && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpense.isPending}>{createExpense.isPending ? 'Creating...' : 'Add Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input id="edit-amount" type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <SearchableCombobox options={EXPENSE_CATEGORIES} value={formData.category} onChange={(value) => setFormData({ ...formData, category: value })} placeholder="Select category..." />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <SearchableCombobox options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} />
              </div>
              <div className="grid gap-2">
                <Label>Receipt</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="edit-receipt"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('edit-receipt')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    {receiptFile ? receiptFile.name : 'Upload New Receipt'}
                  </Button>
                  {selectedExpense?.receipt_path && !receiptFile && (
                    <a href={selectedExpense.receipt_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      View Current
                    </a>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateExpense.isPending}>{updateExpense.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
          {selectedExpense && (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedExpense.date), 'MMM d, yyyy')}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedExpense.status} /></div>
              <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{selectedExpense.title}</p></div>
              <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-bold">${Number(selectedExpense.amount).toLocaleString()}</p></div>
              <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{EXPENSE_CATEGORIES.find(c => c.value === selectedExpense.category)?.label || selectedExpense.category || '-'}</p></div>
              <div>
                <p className="text-sm text-muted-foreground">Receipt</p>
                {selectedExpense.receipt_path ? (
                  <a href={selectedExpense.receipt_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <FileImage className="h-4 w-4" />
                    View Receipt
                  </a>
                ) : <p className="text-muted-foreground">-</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} title="Delete Expense" description="Are you sure you want to delete this expense?" confirmLabel="Delete" onConfirm={handleDelete} variant="destructive" />
    </div>
  );
}
