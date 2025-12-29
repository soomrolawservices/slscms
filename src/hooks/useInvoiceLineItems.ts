import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LineItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export function useInvoiceLineItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-line-items', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LineItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateLineItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, items }: { invoiceId: string; items: LineItem[] }) => {
      // Delete existing items first
      await supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId);

      if (items.length === 0) return [];

      const { data, error } = await supabase
        .from('invoice_line_items')
        .insert(items.map(item => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-line-items', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving line items', description: error.message, variant: 'destructive' });
    },
  });
}
