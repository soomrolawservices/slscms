import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { createNotification } from '@/hooks/useCreateNotification';

export interface InvoiceData {
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
}

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name), cases(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { amount: number; client_id: string; case_id?: string; due_date?: string; status?: string }) => {
      // Generate invoice ID
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      const invoiceId = `SLS-INV-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data: result, error } = await supabase
        .from('invoices')
        .insert({
          amount: data.amount,
          client_id: data.client_id,
          case_id: data.case_id,
          due_date: data.due_date,
          status: data.status || 'unpaid',
          invoice_id: invoiceId,
          created_by: user?.id,
        })
        .select('*, clients(name)')
        .single();

      if (error) throw error;

      // Send notification to client
      if (result) {
        const { data: clientAccess } = await supabase
          .from('client_access')
          .select('user_id')
          .eq('client_id', data.client_id)
          .maybeSingle();

        if (clientAccess?.user_id) {
          await createNotification({
            userId: clientAccess.user_id,
            title: 'New Invoice Generated',
            message: `Invoice ${invoiceId} for PKR ${data.amount.toLocaleString()} has been generated.`,
            type: 'warning',
            entityType: 'invoice',
            entityId: result.id,
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating invoice', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvoiceData> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating invoice', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting invoice', description: error.message, variant: 'destructive' });
    },
  });
}
