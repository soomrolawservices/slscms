-- Create case_activities table for timeline tracking
CREATE TABLE public.case_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all case activities"
ON public.case_activities FOR ALL
USING (is_admin());

CREATE POLICY "Team members can view activities for assigned cases"
ON public.case_activities FOR SELECT
USING (case_id IN (
  SELECT id FROM cases 
  WHERE assigned_to = auth.uid() OR created_by = auth.uid()
));

CREATE POLICY "Team members can create activities for assigned cases"
ON public.case_activities FOR INSERT
WITH CHECK (case_id IN (
  SELECT id FROM cases 
  WHERE assigned_to = auth.uid() OR created_by = auth.uid()
));

CREATE POLICY "Clients can view activities for their cases"
ON public.case_activities FOR SELECT
USING (case_id IN (
  SELECT c.id FROM cases c
  JOIN client_access ca ON c.client_id = ca.client_id
  WHERE ca.user_id = auth.uid()
));

-- Add index for performance
CREATE INDEX idx_case_activities_case_id ON public.case_activities(case_id);
CREATE INDEX idx_case_activities_created_at ON public.case_activities(created_at DESC);

-- Add expense_type column to expenses for categorization
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'general';

-- Insert default expense categories in dropdown_options
INSERT INTO public.dropdown_options (category, value, label, sort_order, is_active)
VALUES 
  ('expense_type', 'salary', 'Salary & Wages', 1, true),
  ('expense_type', 'rent', 'Rent & Lease', 2, true),
  ('expense_type', 'utilities', 'Utilities', 3, true),
  ('expense_type', 'marketing', 'Marketing & Advertising', 4, true),
  ('expense_type', 'taxes', 'Taxes', 5, true),
  ('expense_type', 'office_supplies', 'Office Supplies', 6, true),
  ('expense_type', 'travel', 'Travel & Transportation', 7, true),
  ('expense_type', 'professional_services', 'Professional Services', 8, true),
  ('expense_type', 'insurance', 'Insurance', 9, true),
  ('expense_type', 'maintenance', 'Maintenance & Repairs', 10, true),
  ('expense_type', 'general', 'General Expense', 11, true)
ON CONFLICT DO NOTHING;