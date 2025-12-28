-- Create signup settings table
CREATE TABLE public.signup_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.signup_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.signup_settings (setting_key, setting_value) VALUES 
  ('client_signup_enabled', true),
  ('team_signup_enabled', true);

-- Policies
CREATE POLICY "Anyone can view signup settings" 
ON public.signup_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage signup settings" 
ON public.signup_settings 
FOR ALL 
USING (is_admin());

-- Add 'pending' status to appointments for client requests
-- Update existing appointments status check
COMMENT ON COLUMN public.appointments.status IS 'Status: scheduled, pending, confirmed, completed, cancelled';

-- Add assigned_to column policy for clients booking appointments
CREATE POLICY "Clients can create appointment requests"
ON public.appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_access 
    WHERE client_access.user_id = auth.uid() 
    AND client_access.client_id = appointments.client_id
  )
);

CREATE POLICY "Clients can view their appointments"
ON public.appointments
FOR SELECT
USING (
  client_id IN (
    SELECT client_access.client_id 
    FROM public.client_access 
    WHERE client_access.user_id = auth.uid()
  )
);