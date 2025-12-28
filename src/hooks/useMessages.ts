import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  client_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  team_member_id: string | null;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useConversations(clientId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', clientId],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, subject }: { clientId: string; subject: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          client_id: clientId,
          subject,
          team_member_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      clientId,
      receiverId 
    }: { 
      conversationId: string; 
      content: string; 
      clientId: string;
      receiverId?: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          receiver_id: receiverId || null,
          client_id: clientId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data as Message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);

      if (error) throw error;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
