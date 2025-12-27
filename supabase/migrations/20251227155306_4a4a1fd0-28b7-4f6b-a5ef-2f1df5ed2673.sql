-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'team_member');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'blocked');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cnic TEXT,
  avatar_url TEXT,
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'individual',
  phone TEXT,
  email TEXT,
  cnic TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT,
  file_size INTEGER,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date TIMESTAMP WITH TIME ZONE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  type TEXT NOT NULL DEFAULT 'in-office',
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credentials table
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  platform_name TEXT NOT NULL,
  url TEXT,
  username TEXT,
  password_encrypted TEXT,
  pin_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT,
  receipt_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dropdown_options table for admin-managed dropdowns
CREATE TABLE public.dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (category, value)
);

-- Create permissions table for RBAC
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_read_own BOOLEAN NOT NULL DEFAULT true,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Create function to get user status
CREATE OR REPLACE FUNCTION public.get_user_status(_user_id UUID)
RETURNS user_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- RLS Policies for clients
CREATE POLICY "Admins can do all on clients" ON public.clients
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view assigned clients" ON public.clients
  FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Team members can create clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team members can update assigned clients" ON public.clients
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- RLS Policies for cases
CREATE POLICY "Admins can do all on cases" ON public.cases
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view assigned cases" ON public.cases
  FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Team members can create cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team members can update assigned cases" ON public.cases
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- RLS Policies for documents
CREATE POLICY "Admins can do all on documents" ON public.documents
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view documents for assigned clients" ON public.documents
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Team members can upload documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for payments
CREATE POLICY "Admins can do all on payments" ON public.payments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view payments for assigned clients" ON public.payments
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Team members can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for invoices
CREATE POLICY "Admins can do all on invoices" ON public.invoices
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view invoices for assigned clients" ON public.invoices
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Team members can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for appointments
CREATE POLICY "Admins can do all on appointments" ON public.appointments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view their appointments" ON public.appointments
  FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Team members can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team members can update their appointments" ON public.appointments
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- RLS Policies for credentials
CREATE POLICY "Admins can do all on credentials" ON public.credentials
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view credentials for assigned clients" ON public.credentials
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  );

-- RLS Policies for expenses
CREATE POLICY "Admins can do all on expenses" ON public.expenses
  FOR ALL USING (public.is_admin());

CREATE POLICY "Team members can view their expenses" ON public.expenses
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Team members can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for dropdown_options (public read, admin write)
CREATE POLICY "Anyone can view dropdown options" ON public.dropdown_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage dropdown options" ON public.dropdown_options
  FOR ALL USING (public.is_admin());

-- RLS Policies for permissions
CREATE POLICY "Anyone can view permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (public.is_admin());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'pending'
  );
  
  -- Assign team_member role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'team_member');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for roles
INSERT INTO public.permissions (role, module, can_create, can_read, can_read_own, can_update, can_delete, can_export) VALUES
  ('admin', 'clients', true, true, true, true, true, true),
  ('admin', 'cases', true, true, true, true, true, true),
  ('admin', 'documents', true, true, true, true, true, true),
  ('admin', 'payments', true, true, true, true, true, true),
  ('admin', 'invoices', true, true, true, true, true, true),
  ('admin', 'appointments', true, true, true, true, true, true),
  ('admin', 'credentials', true, true, true, true, true, true),
  ('admin', 'expenses', true, true, true, true, true, true),
  ('admin', 'users', true, true, true, true, true, true),
  ('team_member', 'clients', true, false, true, true, false, false),
  ('team_member', 'cases', true, false, true, true, false, false),
  ('team_member', 'documents', true, false, true, false, false, false),
  ('team_member', 'payments', true, false, true, false, false, false),
  ('team_member', 'invoices', true, false, true, false, false, false),
  ('team_member', 'appointments', true, false, true, true, false, false),
  ('team_member', 'credentials', false, false, true, false, false, false),
  ('team_member', 'expenses', true, false, true, true, false, false),
  ('team_member', 'users', false, false, false, false, false, false);

-- Insert default dropdown options
INSERT INTO public.dropdown_options (category, value, label, sort_order) VALUES
  ('client_type', 'individual', 'Individual', 1),
  ('client_type', 'corporate', 'Corporate', 2),
  ('client_type', 'government', 'Government', 3),
  ('case_status', 'active', 'Active', 1),
  ('case_status', 'pending', 'Pending', 2),
  ('case_status', 'closed', 'Closed', 3),
  ('case_status', 'on_hold', 'On Hold', 4),
  ('document_type', 'contract', 'Contract', 1),
  ('document_type', 'court_filing', 'Court Filing', 2),
  ('document_type', 'correspondence', 'Correspondence', 3),
  ('document_type', 'evidence', 'Evidence', 4),
  ('document_type', 'other', 'Other', 5),
  ('payment_status', 'pending', 'Pending', 1),
  ('payment_status', 'completed', 'Completed', 2),
  ('payment_status', 'failed', 'Failed', 3),
  ('invoice_status', 'unpaid', 'Unpaid', 1),
  ('invoice_status', 'paid', 'Paid', 2),
  ('invoice_status', 'overdue', 'Overdue', 3),
  ('appointment_type', 'in-office', 'In-Office', 1),
  ('appointment_type', 'outdoor', 'Outdoor', 2),
  ('appointment_type', 'virtual', 'Virtual', 3),
  ('expense_category', 'travel', 'Travel', 1),
  ('expense_category', 'supplies', 'Supplies', 2),
  ('expense_category', 'legal_fees', 'Legal Fees', 3),
  ('expense_category', 'other', 'Other', 4);