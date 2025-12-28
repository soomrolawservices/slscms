import { useState } from 'react';
import { Check, X, MoreHorizontal, Eye, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExpenseData, useUpdateExpense } from '@/hooks/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ExpenseApprovalProps {
  expenses: ExpenseData[];
  isLoading: boolean;
}

const EXPENSE_CATEGORIES: Record<string, string> = {
  office_supplies: 'Office Supplies',
  travel: 'Travel',
  utilities: 'Utilities',
  software: 'Software & Subscriptions',
  legal_fees: 'Legal Fees',
  marketing: 'Marketing',
  equipment: 'Equipment',
  meals: 'Meals & Entertainment',
  professional_services: 'Professional Services',
  other: 'Other',
};

export function ExpenseApproval({ expenses, isLoading }: ExpenseApprovalProps) {
  const updateExpense = useUpdateExpense();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  const sendNotification = async (expenseId: string, action: 'approved' | 'rejected', reason?: string) => {
    try {
      await supabase.functions.invoke('expense-notification', {
        body: { expenseId, action, reason },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleApprove = async (expense: ExpenseData) => {
    await updateExpense.mutateAsync({
      id: expense.id,
      status: 'approved',
    });
    await sendNotification(expense.id, 'approved');
    toast({ title: 'Expense approved' });
  };

  const handleRejectClick = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleReject = async () => {
    if (!selectedExpense) return;
    await updateExpense.mutateAsync({
      id: selectedExpense.id,
      status: 'rejected',
    });
    await sendNotification(selectedExpense.id, 'rejected', rejectReason);
    toast({ title: 'Expense rejected' });
    setIsRejectOpen(false);
    setSelectedExpense(null);
    setRejectReason('');
  };

  const handleView = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setIsViewOpen(true);
  };

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
      render: (row) => EXPENSE_CATEGORIES[row.category || ''] || row.category || '-',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">{pendingExpenses.length} expenses waiting for review</p>
        </div>
      </div>

      <DataTable
        data={pendingExpenses}
        columns={columns}
        searchPlaceholder="Search pending expenses..."
        searchKey="title"
        title="Pending Expenses"
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleApprove(row)} className="text-green-600">
                <Check className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRejectClick(row)} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedExpense.date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedExpense.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold">${Number(selectedExpense.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{EXPENSE_CATEGORIES[selectedExpense.category || ''] || selectedExpense.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt</p>
                  {selectedExpense.receipt_path ? (
                    <a href={selectedExpense.receipt_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <FileImage className="h-4 w-4" />
                      View Receipt
                    </a>
                  ) : <span className="text-muted-foreground">Not attached</span>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button variant="destructive" onClick={() => { setIsViewOpen(false); handleRejectClick(selectedExpense); }}>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => { handleApprove(selectedExpense); setIsViewOpen(false); }}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject "{selectedExpense?.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updateExpense.isPending}>
              {updateExpense.isPending ? 'Rejecting...' : 'Reject Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
