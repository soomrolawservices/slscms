import { useState, useMemo } from 'react';
import { AlertTriangle, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { useExpenseBudgets, useCreateExpenseBudget, useUpdateExpenseBudget, useDeleteExpenseBudget, ExpenseBudget } from '@/hooks/useExpenseBudgets';
import { ExpenseData } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface ExpenseBudgetManagerProps {
  expenses: ExpenseData[];
}

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

export function ExpenseBudgetManager({ expenses }: ExpenseBudgetManagerProps) {
  const { isAdmin } = useAuth();
  const { data: budgets = [], isLoading } = useExpenseBudgets();
  const createBudget = useCreateExpenseBudget();
  const updateBudget = useUpdateExpenseBudget();
  const deleteBudget = useDeleteExpenseBudget();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<ExpenseBudget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    monthly_limit: 0,
    alert_threshold: 80,
  });

  // Calculate current month spending by category
  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const spending: Record<string, number> = {};
    expenses.forEach(e => {
      const expenseDate = new Date(e.date);
      if (expenseDate >= monthStart && expenseDate <= monthEnd && e.status === 'approved') {
        const cat = e.category || 'other';
        spending[cat] = (spending[cat] || 0) + Number(e.amount);
      }
    });
    return spending;
  }, [expenses]);

  const resetForm = () => {
    setFormData({ category: '', monthly_limit: 0, alert_threshold: 80 });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBudget.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (budget: ExpenseBudget) => {
    setSelectedBudget(budget);
    setFormData({
      category: budget.category,
      monthly_limit: Number(budget.monthly_limit),
      alert_threshold: budget.alert_threshold,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    await updateBudget.mutateAsync({ id: selectedBudget.id, ...formData });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;
    await deleteBudget.mutateAsync(selectedBudget.id);
    setIsDeleteOpen(false);
    setSelectedBudget(null);
  };

  const getCategoryLabel = (cat: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  const usedCategories = budgets.map(b => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c.value) || c.value === formData.category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budget Limits</h3>
          <p className="text-sm text-muted-foreground">Set monthly spending limits by category ({format(new Date(), 'MMMM yyyy')})</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Button>
        )}
      </div>

      {budgets.length === 0 ? (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No budget limits set yet</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Set Your First Budget
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const spent = currentMonthSpending[budget.category] || 0;
            const limit = Number(budget.monthly_limit);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = percentage >= 100;
            const isApproaching = percentage >= budget.alert_threshold && percentage < 100;

            return (
              <Card key={budget.id} className={`border-2 ${isOverBudget ? 'border-destructive' : isApproaching ? 'border-yellow-500' : 'border-border'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{getCategoryLabel(budget.category)}</CardTitle>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(budget)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelectedBudget(budget); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription>Limit: PKR {limit.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Spent: PKR {spent.toLocaleString()}</span>
                      <span className={`font-medium ${isOverBudget ? 'text-destructive' : isApproaching ? 'text-yellow-600' : 'text-green-600'}`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isApproaching ? '[&>div]:bg-yellow-500' : ''}`} />
                    {(isOverBudget || isApproaching) && (
                      <div className={`flex items-center gap-1 text-xs ${isOverBudget ? 'text-destructive' : 'text-yellow-600'}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {isOverBudget ? 'Over budget!' : `Approaching limit (${budget.alert_threshold}% threshold)`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Add Budget Limit</DialogTitle>
            <DialogDescription>Set a monthly spending limit for a category</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <SearchableCombobox
                  options={availableCategories}
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder="Select category..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="limit">Monthly Limit (PKR)</Label>
                <Input
                  id="limit"
                  type="number"
                  min="0"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="threshold">Alert Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || 80 })}
                  required
                />
                <p className="text-xs text-muted-foreground">Alert when spending reaches this percentage of the limit</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createBudget.isPending || !formData.category}>
                {createBudget.isPending ? 'Creating...' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Budget Limit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input value={getCategoryLabel(formData.category)} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-limit">Monthly Limit (PKR)</Label>
                <Input
                  id="edit-limit"
                  type="number"
                  min="0"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-threshold">Alert Threshold (%)</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || 80 })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateBudget.isPending}>
                {updateBudget.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Budget"
        description={`Are you sure you want to delete the budget for ${selectedBudget ? getCategoryLabel(selectedBudget.category) : ''}?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
