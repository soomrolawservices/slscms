import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User, Plus, Check, CheckCheck, Users, Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_id: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface ChatThread {
  id: string;
  type: 'client' | 'team';
  participant_id: string;
  participant_name: string;
  participant_email?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  conversation_id: string;
}

export default function Messages() {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: clients = [] } = useClients();
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvClientId, setNewConvClientId] = useState('');
  const [newConvTeamMemberId, setNewConvTeamMemberId] = useState('');
  const [newConvMessage, setNewConvMessage] = useState('');
  const [chatType, setChatType] = useState<'client' | 'team'>('client');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch team members (admins and team_members, excluding self)
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

  // Fetch chat threads - grouped by participant (single thread per client/team member like WhatsApp)
  const { data: chatThreads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['staff-chat-threads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all conversations where user is involved
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, client_id, team_member_id, updated_at, clients(name)')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return [];

      const threads: ChatThread[] = [];
      const processedClients = new Set<string>();
      const processedTeamMembers = new Set<string>();

      for (const conv of conversations) {
        // Client thread
        if (conv.client_id && !processedClients.has(conv.client_id)) {
          processedClients.add(conv.client_id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user?.id);

          threads.push({
            id: `client-${conv.client_id}`,
            type: 'client',
            participant_id: conv.client_id,
            participant_name: (conv.clients as any)?.name || 'Unknown Client',
            last_message: lastMsg?.content || '',
            last_message_time: lastMsg?.created_at || conv.updated_at,
            unread_count: unreadCount || 0,
            conversation_id: conv.id,
          });
        }
      }

      return threads.sort((a, b) =>
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
    },
    enabled: !!user,
  });

  // Fetch messages for selected thread
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['staff-thread-messages', selectedThread?.conversation_id],
    queryFn: async () => {
      if (!selectedThread?.conversation_id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedThread.conversation_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!selectedThread?.conversation_id,
  });

  // Total unread count across all threads
  const totalUnread = chatThreads.reduce((acc, t) => acc + t.unread_count, 0);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedThread?.conversation_id) return;

    const channel = supabase
      .channel(`staff-messages-${selectedThread.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedThread.conversation_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-thread-messages', selectedThread.conversation_id] });
          queryClient.invalidateQueries({ queryKey: ['staff-chat-threads', user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.conversation_id, queryClient, user?.id]);

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
          queryClient.invalidateQueries({ queryKey: ['staff-chat-threads', user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing thread
  useEffect(() => {
    if (selectedThread?.conversation_id) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', selectedThread.conversation_id)
        .neq('sender_id', user?.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['staff-chat-threads', user?.id] });
        });
    }
  }, [selectedThread?.conversation_id, user?.id, queryClient]);

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedThread.conversation_id,
          sender_id: user?.id,
          client_id: selectedThread.type === 'client' ? selectedThread.participant_id : null,
          receiver_id: selectedThread.type === 'team' ? selectedThread.participant_id : null,
          content: newMessage.trim(),
          reply_to_id: replyingTo?.id || null,
        });

      if (error) throw error;

      // Update conversation timestamp and assign team member
      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          team_member_id: user?.id,
        })
        .eq('id', selectedThread.conversation_id);

      // Create notification
      if (selectedThread.type === 'client') {
        const { data: access } = await supabase
          .from('client_access')
          .select('user_id')
          .eq('client_id', selectedThread.participant_id)
          .maybeSingle();

        if (access?.user_id) {
          await createNotification({
            userId: access.user_id,
            title: 'New Message',
            message: `${profile?.name || 'Team Member'}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
            type: 'info',
            entityType: 'conversation',
            entityId: selectedThread.conversation_id,
          });
        }
      } else {
        await createNotification({
          userId: selectedThread.participant_id,
          title: 'New Message',
          message: `${profile?.name || 'Team Member'}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
          type: 'info',
          entityType: 'conversation',
          entityId: selectedThread.conversation_id,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['staff-thread-messages', selectedThread.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['staff-chat-threads', user?.id] });
      setNewMessage('');
      setReplyingTo(null);
    } catch (error: any) {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = async () => {
    if (chatType === 'client') {
      if (!newConvClientId || !newConvMessage.trim()) return;

      try {
        // Check if conversation already exists with this client
        const existingThread = chatThreads.find(
          t => t.type === 'client' && t.participant_id === newConvClientId
        );

        let conversationId: string;

        if (existingThread) {
          conversationId = existingThread.conversation_id;
        } else {
          const client = clients.find(c => c.id === newConvClientId);
          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert({
              client_id: newConvClientId,
              team_member_id: user?.id,
              subject: `Chat with ${client?.name || 'Client'}`,
            })
            .select()
            .single();

          if (convError) throw convError;
          conversationId = conv.id;
        }

        // Send message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user?.id,
            client_id: newConvClientId,
            content: newConvMessage.trim(),
          });

        if (msgError) throw msgError;

        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        // Notify client
        const { data: access } = await supabase
          .from('client_access')
          .select('user_id')
          .eq('client_id', newConvClientId)
          .maybeSingle();

        if (access?.user_id) {
          await createNotification({
            userId: access.user_id,
            title: 'New Message from Legal Team',
            message: `${profile?.name || 'Team Member'}: ${newConvMessage.trim().substring(0, 50)}`,
            type: 'info',
            entityType: 'conversation',
            entityId: conversationId,
          });
        }

        const client = clients.find(c => c.id === newConvClientId);
        queryClient.invalidateQueries({ queryKey: ['staff-chat-threads', user?.id] });
        setSelectedThread({
          id: `client-${newConvClientId}`,
          type: 'client',
          participant_id: newConvClientId,
          participant_name: client?.name || 'Client',
          last_message: newConvMessage.trim(),
          last_message_time: new Date().toISOString(),
          unread_count: 0,
          conversation_id: conversationId,
        });

        setNewConvClientId('');
        setNewConvMessage('');
        setIsNewConvOpen(false);
        toast({ title: 'Message sent' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      // Team chat - similar logic
      if (!newConvTeamMemberId || !newConvMessage.trim()) return;

      try {
        // For team-to-team, we need a placeholder client_id (this is a limitation of current schema)
        // In a real app, you'd have a separate team_conversations table
        const teamMember = teamMembers.find(tm => tm.id === newConvTeamMemberId);

        await createNotification({
          userId: newConvTeamMemberId,
          title: 'New Message',
          message: `${profile?.name || 'Team Member'}: ${newConvMessage.trim().substring(0, 50)}`,
          type: 'info',
        });

        toast({ title: 'Message sent', description: 'Team member has been notified' });
        setNewConvTeamMemberId('');
        setNewConvMessage('');
        setIsNewConvOpen(false);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));

  if (loadingThreads) {
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
            {chatThreads.length} conversations
          </p>
        </div>
        <Button onClick={() => setIsNewConvOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Mobile: Show either list or chat */}
      <div className="lg:hidden">
        {!selectedThread ? (
          // Chat List (Mobile)
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Chats
              </CardTitle>
              <CardDescription>{chatThreads.length} total</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {chatThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-sm">Start a new conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {chatThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
                    >
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {thread.participant_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate flex-1">
                            {thread.participant_name}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(thread.last_message_time), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {thread.last_message}
                          </p>
                          {thread.unread_count > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] justify-center shrink-0">
                              {thread.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Chat View (Mobile - Full Screen)
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border py-3 px-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSelectedThread(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {selectedThread.participant_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{selectedThread.participant_name}</CardTitle>
                  <CardDescription className="text-xs capitalize truncate">
                    {selectedThread.type}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[300px] p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                        <Skeleton className="h-16 w-3/4 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      const repliedMessage = msg.reply_to_id 
                        ? messages.find(m => m.id === msg.reply_to_id)
                        : null;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex group",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className="flex items-center gap-1 max-w-[85%]">
                            {!isOwn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={() => setReplyingTo(msg)}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                            )}
                            <div
                              className={cn(
                                "rounded-lg p-3 shadow-sm",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted rounded-bl-sm"
                              )}
                            >
                              {repliedMessage && (
                                <div className={cn(
                                  "text-xs mb-2 p-2 rounded border-l-2",
                                  isOwn 
                                    ? "bg-primary-foreground/10 border-primary-foreground/50" 
                                    : "bg-background/50 border-primary/50"
                                )}>
                                  <p className="font-medium text-[10px] opacity-70">
                                    {repliedMessage.sender_id === user?.id ? 'You' : selectedThread.participant_name}
                                  </p>
                                  <p className="truncate">{repliedMessage.content}</p>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={cn(
                                "flex items-center gap-1 mt-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                <p className={cn(
                                  "text-[10px]",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {format(new Date(msg.created_at), 'h:mm a')}
                                </p>
                                {isOwn && (
                                  msg.is_read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                                  )
                                )}
                              </div>
                            </div>
                            {isOwn && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={() => setReplyingTo(msg)}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t-2 border-border space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Replying to {replyingTo.sender_id === user?.id ? 'yourself' : selectedThread.participant_name}
                      </p>
                      <p className="text-sm truncate">{replyingTo.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={replyingTo ? "Type a reply..." : "Type a message..."}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop: Side by side layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* Chat Thread List */}
        <Card className="border-2 border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chats
            </CardTitle>
            <CardDescription>{chatThreads.length} total</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {chatThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-sm">Start a new conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {chatThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={cn(
                        "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedThread?.id === thread.id && "bg-muted"
                      )}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {thread.participant_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {thread.participant_name}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                              {thread.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(thread.last_message_time), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {thread.last_message}
                          </p>
                          {thread.unread_count > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] justify-center shrink-0">
                              {thread.unread_count}
                            </Badge>
                          )}
                        </div>
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
          {!selectedThread ? (
            <div className="flex items-center justify-center h-[580px] text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b-2 border-border py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {selectedThread.participant_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedThread.participant_name}</CardTitle>
                    <CardDescription className="text-xs capitalize">
                      {selectedThread.type} • {selectedThread.participant_email || ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                          <Skeleton className="h-16 w-3/4 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        const repliedMessage = msg.reply_to_id 
                          ? messages.find(m => m.id === msg.reply_to_id)
                          : null;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex group",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              {!isOwn && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setReplyingTo(msg)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              )}
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-lg p-3 shadow-sm",
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted rounded-bl-sm"
                                )}
                              >
                                {repliedMessage && (
                                  <div className={cn(
                                    "text-xs mb-2 p-2 rounded border-l-2",
                                    isOwn 
                                      ? "bg-primary-foreground/10 border-primary-foreground/50" 
                                      : "bg-background/50 border-primary/50"
                                  )}>
                                    <p className="font-medium text-[10px] opacity-70">
                                      {repliedMessage.sender_id === user?.id ? 'You' : selectedThread.participant_name}
                                    </p>
                                    <p className="truncate">{repliedMessage.content}</p>
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-1",
                                  isOwn ? "justify-end" : "justify-start"
                                )}>
                                  <p className={cn(
                                    "text-[10px]",
                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                  </p>
                                  {isOwn && (
                                    msg.is_read ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                                    )
                                  )}
                                </div>
                              </div>
                              {isOwn && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setReplyingTo(msg)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="p-4 border-t-2 border-border space-y-2">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Replying to {replyingTo.sender_id === user?.id ? 'yourself' : selectedThread.participant_name}
                        </p>
                        <p className="text-sm truncate">{replyingTo.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setReplyingTo(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={replyingTo ? "Type a reply..." : "Type a message..."}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
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

      {/* New Chat Dialog */}
      <Dialog open={isNewConvOpen} onOpenChange={setIsNewConvOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
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
                <User className="h-4 w-4 mr-2" />
                Client
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant={chatType === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChatType('team')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Member
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
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={newConvMessage}
                onChange={(e) => setNewConvMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
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
                !newConvMessage.trim()
              }
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}