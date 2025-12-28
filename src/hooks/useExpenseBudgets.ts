import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ExpenseBudget {
  id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export function useExpenseBudgets() {
  return useQuery({
    queryKey: ['expense-budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_budgets')
        .select('*')
        .order('category');

      if (error) throw error;
      return data as ExpenseBudget[];
    },
  });
}

export function useCreateExpenseBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { category: string; monthly_limit: number; alert_threshold: number }) => {
      const { data: result, error } = await supabase
        .from('expense_budgets')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating budget', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateExpenseBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpenseBudget> & { id: string }) => {
      const { data, error } = await supabase
        .from('expense_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating budget', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteExpenseBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting budget', description: error.message, variant: 'destructive' });
    },
  });
}
