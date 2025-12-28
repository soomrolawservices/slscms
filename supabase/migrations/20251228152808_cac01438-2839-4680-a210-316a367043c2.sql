-- Update handle_new_user to check for role in metadata and default accordingly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, email, name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'pending'
  );
  
  -- Check for role in metadata, default to team_member if not specified
  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'team_member'::app_role
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;