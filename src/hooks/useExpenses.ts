import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string | null;
  expense_type: string | null;
  status: string;
  receipt_path: string | null;
  created_by: string | null;
  created_at: string;
}

export function useExpenses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as ExpenseData[];
    },
    enabled: !!user,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; amount: number; date: string; category?: string; status?: string; receipt_path?: string }) => {
      const { data: result, error } = await supabase
        .from('expenses')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating expense', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpenseData> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating expense', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting expense', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUploadReceipt() {
  return useMutation({
    mutationFn: async ({ file, expenseId }: { file: File; expenseId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`receipts/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`receipts/${fileName}`);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast({ title: 'Error uploading receipt', description: error.message, variant: 'destructive' });
    },
  });
}
