import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User, Plus, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { createNotification } from '@/hooks/useCreateNotification';

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
  receiver_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export default function Messages() {
  const { user, profile, userRole, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: clients = [] } = useClients();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvClientId, setNewConvClientId] = useState('');
  const [newConvTeamMemberId, setNewConvTeamMemberId] = useState('');
  const [newConvSubject, setNewConvSubject] = useState('');
  const [newConvMessage, setNewConvMessage] = useState('');
  const [chatType, setChatType] = useState<'client' | 'team'>('client');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch team members (admins and team_members)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['all-team-members'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'team_member']);

      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
        .eq('status', 'active')
        .neq('id', user?.id);

      return (profiles || []) as TeamMember[];
    },
    enabled: !!user,
  });

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

  // Count unread messages
  const unreadCount = conversations.reduce((acc, conv) => {
    // We'd need to fetch this but for now just count from messages
    return acc;
  }, 0);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`staff-messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

  // Realtime subscription for new conversations
  useEffect(() => {
    const channel = supabase
      .channel('staff-conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
          receiver_id: conversation?.team_member_id !== user?.id ? conversation?.team_member_id : null,
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

      // Create notification for client
      if (conversation?.client_id) {
        // Get client's user_id from client_access
        const { data: access } = await supabase
          .from('client_access')
          .select('user_id')
          .eq('client_id', conversation.client_id)
          .maybeSingle();

        if (access?.user_id) {
          await createNotification({
            userId: access.user_id,
            title: 'New Message',
            message: `${profile?.name || 'Team Member'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            type: 'info',
            entityType: 'conversation',
            entityId: conversationId,
          });
        }
      }

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages', selectedConversation] });
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

  // Create new conversation mutation
  const createConversation = useMutation({
    mutationFn: async ({ clientId, teamMemberId, subject, firstMessage }: { 
      clientId?: string; 
      teamMemberId?: string;
      subject: string; 
      firstMessage: string 
    }) => {
      // For team-to-team chat, we use a special client_id placeholder or create a different structure
      // For now, we'll require a client for conversations
      const actualClientId = clientId || teamMemberId;
      
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: actualClientId,
          team_member_id: user?.id,
          subject,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Send first message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conv.id,
          sender_id: user?.id,
          client_id: clientId || null,
          receiver_id: teamMemberId || null,
          content: firstMessage,
        });

      if (msgError) throw msgError;

      // Notify the recipient
      if (clientId) {
        const { data: access } = await supabase
          .from('client_access')
          .select('user_id')
          .eq('client_id', clientId)
          .maybeSingle();

        if (access?.user_id) {
          await createNotification({
            userId: access.user_id,
            title: 'New Message from Legal Team',
            message: `${profile?.name || 'Team Member'} started a conversation: ${subject}`,
            type: 'info',
            entityType: 'conversation',
            entityId: conv.id,
          });
        }
      }

      if (teamMemberId) {
        await createNotification({
          userId: teamMemberId,
          title: 'New Message',
          message: `${profile?.name || 'Team Member'} started a conversation: ${subject}`,
          type: 'info',
          entityType: 'conversation',
          entityId: conv.id,
        });
      }

      return conv;
    },
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
      setIsNewConvOpen(false);
      setNewConvClientId('');
      setNewConvTeamMemberId('');
      setNewConvSubject('');
      setNewConvMessage('');
      setSelectedConversation(conv.id);
      toast({ title: 'Conversation started' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating conversation', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateConversation = () => {
    if (chatType === 'client') {
      if (!newConvClientId || !newConvSubject.trim() || !newConvMessage.trim()) return;
      createConversation.mutate({
        clientId: newConvClientId,
        subject: newConvSubject.trim(),
        firstMessage: newConvMessage.trim(),
      });
    } else {
      if (!newConvTeamMemberId || !newConvSubject.trim() || !newConvMessage.trim()) return;
      createConversation.mutate({
        teamMemberId: newConvTeamMemberId,
        subject: newConvSubject.trim(),
        firstMessage: newConvMessage.trim(),
      });
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));

  // Total unread messages count
  const totalUnread = messages.filter(m => !m.is_read && m.sender_id !== user?.id).length;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnread} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            {conversations.length} conversations
          </p>
        </div>
        <Button onClick={() => setIsNewConvOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
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
                              <div className={cn(
                                "flex items-center gap-1 mt-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                <p className={cn(
                                  "text-xs",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {format(new Date(msg.created_at), 'h:mm a')}
                                </p>
                                {isOwn && (
                                  msg.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                  ) : (
                                    <Check className="h-3 w-3 text-primary-foreground/70" />
                                  )
                                )}
                              </div>
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

      {/* New Conversation Dialog */}
      <Dialog open={isNewConvOpen} onOpenChange={setIsNewConvOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Start a conversation with a client or team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Chat type selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={chatType === 'client' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatType('client')}
              >
                Chat with Client
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant={chatType === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChatType('team')}
                >
                  Chat with Team
                </Button>
              )}
            </div>

            {chatType === 'client' ? (
              <div className="space-y-2">
                <Label>Client</Label>
                <SearchableCombobox
                  options={clientOptions}
                  value={newConvClientId}
                  onChange={setNewConvClientId}
                  placeholder="Select a client..."
                  searchPlaceholder="Search clients..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Team Member</Label>
                <SearchableCombobox
                  options={teamMemberOptions}
                  value={newConvTeamMemberId}
                  onChange={setNewConvTeamMemberId}
                  placeholder="Select a team member..."
                  searchPlaceholder="Search team members..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newConvSubject}
                onChange={(e) => setNewConvSubject(e.target.value)}
                placeholder="e.g., Case Update, Follow-up"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-message">Message</Label>
              <Input
                id="first-message"
                value={newConvMessage}
                onChange={(e) => setNewConvMessage(e.target.value)}
                placeholder="Type your message..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConvOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConversation}
              disabled={
                (chatType === 'client' && !newConvClientId) ||
                (chatType === 'team' && !newConvTeamMemberId) ||
                !newConvSubject.trim() || 
                !newConvMessage.trim() || 
                createConversation.isPending
              }
            >
              {createConversation.isPending ? 'Starting...' : 'Start Conversation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
