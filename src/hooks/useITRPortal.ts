import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Fiscal Years
export function useITRFiscalYears() {
  return useQuery({
    queryKey: ['itr-fiscal-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itr_fiscal_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFiscalYear() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { year_label: string; start_date: string; end_date: string }) => {
      const { data: result, error } = await supabase
        .from('itr_fiscal_years')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itr-fiscal-years'] });
      toast({ title: 'Fiscal year created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating fiscal year', description: error.message, variant: 'destructive' });
    },
  });
}

// Client Banks
export function useITRClientBanks(clientId?: string) {
  return useQuery({
    queryKey: ['itr-client-banks', clientId],
    queryFn: async () => {
      let query = supabase.from('itr_client_banks').select('*');
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query.order('bank_name');

      if (error) throw error;
      return data;
    },
    enabled: clientId !== undefined,
  });
}

export function useCreateClientBank() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { client_id: string; bank_name: string }) => {
      const { data: result, error } = await supabase
        .from('itr_client_banks')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { client_id }) => {
      queryClient.invalidateQueries({ queryKey: ['itr-client-banks', client_id] });
      toast({ title: 'Bank added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding bank', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClientBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('itr_client_banks').delete().eq('id', id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['itr-client-banks', clientId] });
      toast({ title: 'Bank removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing bank', description: error.message, variant: 'destructive' });
    },
  });
}

// ITR Returns
export function useITRReturns(fiscalYearId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['itr-returns', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('itr_returns')
        .select(`
          *,
          clients(id, name, client_type, email, phone),
          itr_fiscal_years(year_label),
          profiles:assigned_to(name)
        `);

      if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateITRReturn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      client_id: string; 
      fiscal_year_id: string; 
      assigned_to?: string;
      title?: string;
    }) => {
      // First check if client already has a return for this fiscal year
      const { data: existingReturn } = await supabase
        .from('itr_returns')
        .select('id')
        .eq('client_id', data.client_id)
        .eq('fiscal_year_id', data.fiscal_year_id)
        .maybeSingle();

      if (existingReturn) {
        throw new Error('This client already has a return for this fiscal year');
      }

      const { data: result, error } = await supabase
        .from('itr_returns')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This client already has a return for this fiscal year');
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itr-returns'] });
      queryClient.invalidateQueries({ queryKey: ['itr-dashboard-stats'] });
      toast({ title: 'ITR Return created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating ITR return', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateITRReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      progress?: string;
      payment_amount?: number;
      payment_status?: string;
      has_extension?: boolean;
      extension_status?: string;
      assigned_to?: string;
      title?: string;
    }) => {
      const { data, error } = await supabase
        .from('itr_returns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itr-returns'] });
      toast({ title: 'ITR Return updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating ITR return', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteITRReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('itr_returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itr-returns'] });
      toast({ title: 'ITR Return deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting ITR return', description: error.message, variant: 'destructive' });
    },
  });
}

// Bank Statements
export function useITRBankStatements(returnId?: string) {
  return useQuery({
    queryKey: ['itr-bank-statements', returnId],
    queryFn: async () => {
      if (!returnId) return [];
      const { data, error } = await supabase
        .from('itr_bank_statements')
        .select(`*, itr_client_banks(bank_name)`)
        .eq('return_id', returnId);

      if (error) throw error;
      return data;
    },
    enabled: !!returnId,
  });
}

export function useUpsertBankStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      return_id: string;
      bank_id: string;
      file_path?: string;
      status?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('itr_bank_statements')
        .upsert(data, { onConflict: 'return_id,bank_id' })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { return_id }) => {
      queryClient.invalidateQueries({ queryKey: ['itr-bank-statements', return_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating bank statement', description: error.message, variant: 'destructive' });
    },
  });
}

// Extensions
export function useITRExtensions(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['itr-extensions', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('itr_returns')
        .select(`
          *,
          clients(id, name, client_type),
          itr_fiscal_years(year_label)
        `)
        .eq('has_extension', true);

      if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ITR Portal Setting
export function useITRPortalEnabled() {
  return useQuery({
    queryKey: ['itr-portal-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signup_settings')
        .select('setting_value')
        .eq('setting_key', 'itr_portal_enabled')
        .maybeSingle();

      if (error) throw error;
      return data?.setting_value ?? false;
    },
  });
}

// Dashboard Stats
export function useITRDashboardStats(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['itr-dashboard-stats', fiscalYearId],
    queryFn: async () => {
      let query = supabase.from('itr_returns').select('*');
      if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
      
      const { data, error } = await query;
      if (error) throw error;

      const returns = data || [];
      const totalClients = returns.length;
      const pending = returns.filter(r => r.progress === 'pending').length;
      const filed = returns.filter(r => r.progress === 'filed').length;
      const inProgress = returns.filter(r => !['pending', 'filed'].includes(r.progress)).length;
      const extensions = returns.filter(r => r.has_extension).length;
      const totalRevenue = returns.reduce((sum, r) => sum + (r.payment_amount || 0), 0);
      const paid = returns.filter(r => r.payment_status === 'paid').length;
      const unpaid = returns.filter(r => r.payment_status === 'unpaid').length;

      const progressDistribution = {
        pending: returns.filter(r => r.progress === 'pending').length,
        bank_statement_compiled: returns.filter(r => r.progress === 'bank_statement_compiled').length,
        drafted: returns.filter(r => r.progress === 'drafted').length,
        discussion: returns.filter(r => r.progress === 'discussion').length,
        filed: returns.filter(r => r.progress === 'filed').length,
      };

      return {
        totalClients,
        pending,
        filed,
        inProgress,
        extensions,
        totalRevenue,
        paid,
        unpaid,
        progressDistribution,
      };
    },
  });
}
