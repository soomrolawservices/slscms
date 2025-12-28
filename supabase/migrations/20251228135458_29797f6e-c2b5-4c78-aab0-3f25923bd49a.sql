-- Add 'client' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Create a client_access table to link clients to user accounts
CREATE TABLE IF NOT EXISTS public.client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Enable RLS on client_access
ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;

-- Policies for client_access
CREATE POLICY "Admins can manage client access"
ON public.client_access FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own client access"
ON public.client_access FOR SELECT
USING (auth.uid() = user_id);

-- Add RLS policies for clients to view their linked client data
CREATE POLICY "Clients can view their linked client data"
ON public.clients FOR SELECT
USING (
  id IN (SELECT client_id FROM public.client_access WHERE user_id = auth.uid())
);

-- Add RLS policies for clients to view their cases
CREATE POLICY "Clients can view their linked cases"
ON public.cases FOR SELECT
USING (
  client_id IN (SELECT client_id FROM public.client_access WHERE user_id = auth.uid())
);

-- Add RLS policies for clients to view their documents
CREATE POLICY "Clients can view their linked documents"
ON public.documents FOR SELECT
USING (
  client_id IN (SELECT client_id FROM public.client_access WHERE user_id = auth.uid())
);

-- Add RLS policies for clients to view their payments
CREATE POLICY "Clients can view their linked payments"
ON public.payments FOR SELECT
USING (
  client_id IN (SELECT client_id FROM public.client_access WHERE user_id = auth.uid())
);

-- Add RLS policies for clients to view their invoices
CREATE POLICY "Clients can view their linked invoices"
ON public.invoices FOR SELECT
USING (
  client_id IN (SELECT client_id FROM public.client_access WHERE user_id = auth.uid())
);