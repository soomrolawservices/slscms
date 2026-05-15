
-- Allow public access for forms (anonymous form filling)
ALTER TABLE public.form_submissions ALTER COLUMN submitted_by DROP NOT NULL;

CREATE POLICY "Anyone can view active forms"
  ON public.custom_forms
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Users can submit forms" ON public.form_submissions;
CREATE POLICY "Anyone can submit forms"
  ON public.form_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Anonymous submissions must have null submitted_by
    -- Authenticated submissions must match auth.uid()
    (auth.uid() IS NULL AND submitted_by IS NULL)
    OR (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
  );

-- Enable realtime for signup_settings so portal toggles propagate live
ALTER TABLE public.signup_settings REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signup_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
