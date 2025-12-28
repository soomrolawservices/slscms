-- Fix 1: Restrict permissions table to authenticated users only
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions" 
ON public.permissions FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Restrict dropdown_options to authenticated users (was also public)
DROP POLICY IF EXISTS "Anyone can view dropdown options" ON public.dropdown_options;
CREATE POLICY "Authenticated users can view dropdown options" 
ON public.dropdown_options FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 3: Restrict signup_settings to authenticated users for most access but allow public read for login flow
-- (keeping this as-is since signup settings need to be readable before login)

-- Fix 4: Add storage policy for clients to view their own documents
DROP POLICY IF EXISTS "Users can view documents for assigned clients" ON storage.objects;
CREATE POLICY "Users can view authorized documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.is_admin() OR
    -- Team members can view assigned client documents
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.clients 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    ) OR
    -- Clients can view their own documents
    (storage.foldername(name))[1]::uuid IN (
      SELECT client_id FROM public.client_access
      WHERE user_id = auth.uid()
    )
  )
);