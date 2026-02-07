import { useState, useRef } from 'react';
import { Plus, MoreHorizontal, Eye, Trash2, Upload, FileImage, BarChart3 } from 'lucide-react';
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
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useUploadReceipt, type ExpenseData } from '@/hooks/useExpenses';
import { DataFreshnessIndicator } from '@/components/ui/data-freshness-indicator';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ExpenseReports } from '@/components/expenses/ExpenseReports';
import { ExpenseApproval } from '@/components/expenses/ExpenseApproval';
import { ExpenseBudgetManager } from '@/components/expenses/ExpenseBudgetManager';
import { useAuth } from '@/contexts/AuthContext';
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

const EXPENSE_CATEGORIES_OPTIONS = EXPENSE_CATEGORIES;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export default function Expenses() {
  const expensesQuery = useExpenses();
  const { data: expenses = [], isLoading } = expensesQuery;
  const { isAdmin } = useAuth();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const uploadReceipt = useUploadReceipt();

  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'reports' | 'approval'>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const columns: EditableColumn<ExpenseData>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      editable: false,
      render: (row) => format(new Date(row.date), 'MMM d, yyyy'),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      editable: true,
      editType: 'text',
      bulkEditable: false,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      editable: false,
      render: (row) => <span className="font-bold">PKR {Number(row.amount).toLocaleString()}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      editable: true,
      editType: 'select',
      options: EXPENSE_CATEGORIES_OPTIONS,
      bulkEditable: true,
    },
    {
      key: 'receipt_path',
      header: 'Receipt',
      editable: false,
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
      editable: true,
      editType: 'status',
      options: STATUS_OPTIONS,
      bulkEditable: true,
    },
  ];

  const handleFieldUpdate = async (id: string, key: string, value: string) => {
    await updateExpense.mutateAsync({ id, [key]: value });
  };

  const handleBulkUpdate = async (ids: string[], updates: Record<string, string>) => {
    for (const id of ids) {
      await updateExpense.mutateAsync({ id, ...updates });
    }
  };

  const handleView = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setIsViewOpen(true);
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Expenses</h1>
          <DataFreshnessIndicator
            dataUpdatedAt={expensesQuery.dataUpdatedAt}
            isFetching={expensesQuery.isFetching}
          />
        </div>
          <p className="text-muted-foreground">Track internal firm expenses and receipts</p>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'reports' ? 'default' : 'outline'}
            onClick={() => setViewMode('reports')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          {isAdmin && (
            <Button
              variant={viewMode === 'approval' ? 'default' : 'outline'}
              onClick={() => setViewMode('approval')}
            >
              Approvals ({expenses.filter(e => e.status === 'pending').length})
            </Button>
          )}
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-xs">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {viewMode === 'reports' && (
        <div className="space-y-8">
          <ExpenseBudgetManager expenses={expenses} />
          <ExpenseReports expenses={expenses} />
        </div>
      )}

      {viewMode === 'approval' && isAdmin && (
        <ExpenseApproval expenses={expenses} isLoading={isLoading} />
      )}

      {viewMode === 'list' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border-2 border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">PKR {totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-card border-2 border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">PKR {pendingExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-card border-2 border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">PKR {approvedExpenses.toLocaleString()}</p>
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
          <EditableDataTable
            data={filteredExpenses}
            columns={columns}
            searchPlaceholder="Search expenses..."
            searchKey="title"
            title="Expenses"
            isLoading={isLoading}
            onUpdate={handleFieldUpdate}
            selectable={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkUpdate={handleBulkUpdate}
            isUpdating={updateExpense.isPending}
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
        </>
      )}

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

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
          {selectedExpense && (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedExpense.date), 'MMM d, yyyy')}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedExpense.status} /></div>
              <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{selectedExpense.title}</p></div>
              <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-bold">PKR {Number(selectedExpense.amount).toLocaleString()}</p></div>
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
