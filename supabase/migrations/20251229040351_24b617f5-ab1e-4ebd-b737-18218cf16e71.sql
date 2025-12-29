-- Invoice Line Items Table
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage line items" ON public.invoice_line_items
FOR ALL USING (is_admin());

CREATE POLICY "Team members can view line items" ON public.invoice_line_items
FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE c.assigned_to = auth.uid() OR c.created_by = auth.uid()
  )
);

-- ITR Portal Settings (add to signup_settings)
INSERT INTO public.signup_settings (setting_key, setting_value)
VALUES ('itr_portal_enabled', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ITR Fiscal Years Table
CREATE TABLE public.itr_fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label TEXT NOT NULL UNIQUE, -- e.g., "FY25", "FY26"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.itr_fiscal_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fiscal years" ON public.itr_fiscal_years
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fiscal years" ON public.itr_fiscal_years
FOR ALL USING (is_admin());

-- ITR Client Banks (stored separately, persists across years)
CREATE TABLE public.itr_client_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, bank_name)
);

ALTER TABLE public.itr_client_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view banks for assigned clients" ON public.itr_client_banks
FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid()
  ) OR is_admin()
);

CREATE POLICY "Admins can manage all banks" ON public.itr_client_banks
FOR ALL USING (is_admin());

CREATE POLICY "Team members can manage banks for assigned clients" ON public.itr_client_banks
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Team members can update banks for assigned clients" ON public.itr_client_banks
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid()
  )
);

-- ITR Returns (main tracking table)
CREATE TABLE public.itr_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES public.itr_fiscal_years(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT,
  progress TEXT NOT NULL DEFAULT 'pending' CHECK (progress IN ('pending', 'bank_statement_compiled', 'drafted', 'discussion', 'filed')),
  payment_amount NUMERIC DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('foc', 'unpaid', 'partially_paid', 'paid')),
  has_extension BOOLEAN DEFAULT false,
  extension_status TEXT DEFAULT 'pending' CHECK (extension_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(client_id, fiscal_year_id)
);

ALTER TABLE public.itr_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view assigned returns" ON public.itr_returns
FOR SELECT USING (
  assigned_to = auth.uid() OR 
  client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid()) OR
  is_admin()
);

CREATE POLICY "Admins can manage all returns" ON public.itr_returns
FOR ALL USING (is_admin());

CREATE POLICY "Team members can create returns" ON public.itr_returns
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team members can update assigned returns" ON public.itr_returns
FOR UPDATE USING (
  assigned_to = auth.uid() OR 
  client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
);

-- ITR Bank Statements (per return, per bank)
CREATE TABLE public.itr_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.itr_returns(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES public.itr_client_banks(id) ON DELETE CASCADE,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'working', 'compiled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(return_id, bank_id)
);

ALTER TABLE public.itr_bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view statements for accessible returns" ON public.itr_bank_statements
FOR SELECT USING (
  return_id IN (
    SELECT id FROM itr_returns WHERE 
    assigned_to = auth.uid() OR 
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid()) OR
    is_admin()
  )
);

CREATE POLICY "Admins can manage all statements" ON public.itr_bank_statements
FOR ALL USING (is_admin());

CREATE POLICY "Team members can manage statements for assigned returns" ON public.itr_bank_statements
FOR INSERT WITH CHECK (
  return_id IN (
    SELECT id FROM itr_returns WHERE 
    assigned_to = auth.uid() OR 
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  )
);

CREATE POLICY "Team members can update statements for assigned returns" ON public.itr_bank_statements
FOR UPDATE USING (
  return_id IN (
    SELECT id FROM itr_returns WHERE 
    assigned_to = auth.uid() OR 
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_itr_returns_updated_at
BEFORE UPDATE ON public.itr_returns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itr_bank_statements_updated_at
BEFORE UPDATE ON public.itr_bank_statements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fiscal year
INSERT INTO public.itr_fiscal_years (year_label, start_date, end_date)
VALUES ('FY25', '2024-07-01', '2025-06-30');