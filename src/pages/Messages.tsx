import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface ConversationWithClient {
  id: string;
  client_id: string;
  team_member_id: string | null;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  clients: { name: string } | null;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations with client info
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['staff-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, clients(name)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ConversationWithClient[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['staff-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!selectedConversation,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`staff-messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-messages', selectedConversation] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const conversation = conversations.find(c => c.id === conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          client_id: conversation?.client_id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          team_member_id: user?.id,
        })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
      setNewMessage('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    },
  });

  // Mark messages as read
  const markRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);

      if (error) throw error;
    },
  });

  useEffect(() => {
    if (selectedConversation) {
      markRead.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    await sendMessage.mutateAsync({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loadingConversations) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Client Messages
        </h1>
        <p className="text-muted-foreground">
          Respond to client inquiries and conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="border-2 border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <CardDescription>{conversations.length} total</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedConversation === conv.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {conv.clients?.name || 'Unknown Client'}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{conv.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Badge variant={conv.status === 'open' ? 'default' : 'secondary'}>
                          {conv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="border-2 border-border lg:col-span-2">
          {!selectedConversation ? (
            <div className="flex items-center justify-center h-[580px] text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.id === selectedConversation)?.subject}
                    </CardTitle>
                    <CardDescription>
                      {conversations.find(c => c.id === selectedConversation)?.clients?.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-3/4" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg p-3",
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={cn(
                                "text-xs mt-1",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {format(new Date(msg.created_at), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="p-4 border-t-2 border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your reply..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
