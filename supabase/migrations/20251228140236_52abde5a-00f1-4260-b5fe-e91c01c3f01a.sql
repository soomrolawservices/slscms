-- Create expense_budgets table for category budget limits
CREATE TABLE IF NOT EXISTS public.expense_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  monthly_limit NUMERIC NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

-- Policies for expense_budgets
CREATE POLICY "Admins can manage expense budgets"
ON public.expense_budgets FOR ALL
USING (is_admin());

CREATE POLICY "Team members can view expense budgets"
ON public.expense_budgets FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_expense_budgets_updated_at
BEFORE UPDATE ON public.expense_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();