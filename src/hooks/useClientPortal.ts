import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientAccessData {
  id: string;
  user_id: string;
  client_id: string;
  created_at: string;
}

export function useClientAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-access', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_access')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      return data as ClientAccessData[];
    },
    enabled: !!user,
  });
}

export function useClientPortalData() {
  const { user } = useAuth();
  const { data: clientAccess } = useClientAccess();
  const clientId = clientAccess?.[0]?.client_id;

  const clientQuery = useQuery({
    queryKey: ['client-portal-client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const casesQuery = useQuery({
    queryKey: ['client-portal-cases', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const documentsQuery = useQuery({
    queryKey: ['client-portal-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const paymentsQuery = useQuery({
    queryKey: ['client-portal-payments', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const invoicesQuery = useQuery({
    queryKey: ['client-portal-invoices', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  return {
    client: clientQuery.data,
    cases: casesQuery.data || [],
    documents: documentsQuery.data || [],
    payments: paymentsQuery.data || [],
    invoices: invoicesQuery.data || [],
    isLoading: clientQuery.isLoading || casesQuery.isLoading || documentsQuery.isLoading || paymentsQuery.isLoading || invoicesQuery.isLoading,
    hasAccess: !!clientId,
  };
}
