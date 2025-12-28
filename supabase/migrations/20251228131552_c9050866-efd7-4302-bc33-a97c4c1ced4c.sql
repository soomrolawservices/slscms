-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'application/zip', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view documents for assigned clients"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- Admins can view all
    public.is_admin() OR
    -- Team members can view their own uploads
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.clients 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND public.is_admin());

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add reminder settings to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 60;

-- Create user_permissions table for custom per-user permissions
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  permission_type TEXT NOT NULL,
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  pin_protected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module, permission_type)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- User permissions policies
CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Create updated_at trigger for user_permissions
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();