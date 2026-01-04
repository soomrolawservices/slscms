-- Broadcast messages table for admin announcements
CREATE TABLE public.broadcast_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'banner' CHECK (type IN ('banner', 'modal')),
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'role', 'user')),
  target_role app_role NULL,
  target_user_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track which users have dismissed which broadcasts
CREATE TABLE public.broadcast_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  case_updates BOOLEAN NOT NULL DEFAULT true,
  document_uploads BOOLEAN NOT NULL DEFAULT true,
  appointment_reminders BOOLEAN NOT NULL DEFAULT true,
  invoice_alerts BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  system_announcements BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push notification subscriptions (for service workers)
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Custom forms table
CREATE TABLE public.custom_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Form assignments to users
CREATE TABLE public.form_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Form submissions
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.form_assignments(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  files JSONB DEFAULT '[]',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Broadcast messages policies
CREATE POLICY "Admins can manage broadcasts" ON public.broadcast_messages FOR ALL USING (is_admin());
CREATE POLICY "Users can view active broadcasts targeting them" ON public.broadcast_messages FOR SELECT 
  USING (
    is_active = true 
    AND starts_at <= now() 
    AND (ends_at IS NULL OR ends_at > now())
    AND (
      target_type = 'all' 
      OR (target_type = 'role' AND target_role IN (SELECT role FROM user_roles WHERE user_id = auth.uid()))
      OR (target_type = 'user' AND target_user_id = auth.uid())
    )
  );

-- Broadcast dismissals policies
CREATE POLICY "Users can dismiss broadcasts" ON public.broadcast_dismissals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their dismissals" ON public.broadcast_dismissals FOR SELECT USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can manage their preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Custom forms policies
CREATE POLICY "Admins can manage forms" ON public.custom_forms FOR ALL USING (is_admin());
CREATE POLICY "Team members can view active forms" ON public.custom_forms FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Form assignments policies
CREATE POLICY "Admins can manage assignments" ON public.form_assignments FOR ALL USING (is_admin());
CREATE POLICY "Users can view their assignments" ON public.form_assignments FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Users can update their assignments" ON public.form_assignments FOR UPDATE USING (assigned_to = auth.uid());

-- Form submissions policies
CREATE POLICY "Admins can view all submissions" ON public.form_submissions FOR SELECT USING (is_admin());
CREATE POLICY "Users can submit forms" ON public.form_submissions FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can view their submissions" ON public.form_submissions FOR SELECT USING (submitted_by = auth.uid());

-- Updated at triggers
CREATE TRIGGER update_broadcast_messages_updated_at BEFORE UPDATE ON public.broadcast_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_forms_updated_at BEFORE UPDATE ON public.custom_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();