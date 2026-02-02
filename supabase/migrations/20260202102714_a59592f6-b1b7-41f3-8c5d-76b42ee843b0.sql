-- Allow any authenticated user to insert notifications for any user (for system notifications)
-- This is needed for admin notifications when users register

DROP POLICY IF EXISTS "Users can only insert notifications for themselves" ON public.notifications;

-- Create a more permissive insert policy for authenticated users
-- The system notifications are critical for admin workflow
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Keep the select policy restrictive - users can only see their own
-- This is already in place

-- Add policy for service role to insert (for edge functions)
CREATE POLICY "Service role can insert any notification"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);