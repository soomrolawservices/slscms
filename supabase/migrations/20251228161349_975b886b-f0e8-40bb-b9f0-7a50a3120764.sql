-- Allow clients to view team member/admin profiles for messaging
CREATE POLICY "Clients can view team member profiles"
ON public.profiles
FOR SELECT
USING (
  -- User is a client (has client role)
  public.has_role(auth.uid(), 'client') 
  AND 
  -- Target profile belongs to admin or team_member
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role IN ('admin', 'team_member')
  )
);

-- Allow clients to view user_roles to identify team members
CREATE POLICY "Clients can view staff roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client')
  AND role IN ('admin', 'team_member')
);