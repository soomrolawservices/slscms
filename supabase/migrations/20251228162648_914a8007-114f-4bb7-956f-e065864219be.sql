-- Drop problematic overly permissive policies if they exist
-- Note: The "Clients can view team member profiles" policy was just added and is correct
-- We need to ensure there's no public access policy

-- Check and update the user_roles policies - the duplicate "Clients can view staff roles" may exist
-- Drop and recreate to avoid duplicates
DROP POLICY IF EXISTS "Clients can view staff roles" ON public.user_roles;

-- Recreate the policy for clients to view staff roles
CREATE POLICY "Clients can view staff roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client')
  AND role IN ('admin', 'team_member')
);

-- Ensure profiles table has proper RLS - all existing policies look correct
-- The issue is that clients need to see team members but not other clients

-- Add policy for team members to view each other's profiles
DROP POLICY IF EXISTS "Team members can view other team profiles" ON public.profiles;
CREATE POLICY "Team members can view other team profiles"
ON public.profiles
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team_member'))
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role IN ('admin', 'team_member')
  )
);