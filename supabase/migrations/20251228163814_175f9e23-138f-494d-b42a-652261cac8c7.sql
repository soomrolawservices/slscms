-- Add reply_to_id column for message threading
ALTER TABLE public.messages ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for efficient reply lookups
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);