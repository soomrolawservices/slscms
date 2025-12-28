-- Create messages table for client-team communication
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create conversations table to group messages
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  team_member_id uuid,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key for messages
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Admins can manage all conversations"
ON public.conversations FOR ALL USING (is_admin());

CREATE POLICY "Team members can view assigned client conversations"
ON public.conversations FOR SELECT
USING (
  team_member_id = auth.uid() OR
  client_id IN (
    SELECT id FROM public.clients 
    WHERE assigned_to = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Clients can view their conversations"
ON public.conversations FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM public.client_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM public.client_access WHERE user_id = auth.uid()
  )
);

-- Policies for messages
CREATE POLICY "Admins can manage all messages"
ON public.messages FOR ALL USING (is_admin());

CREATE POLICY "Team members can view messages for their clients"
ON public.messages FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients 
    WHERE assigned_to = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Clients can view their messages"
ON public.messages FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM public.client_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (receiver_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;