import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, Check, CheckCheck, Users, Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useClientPortalData } from '@/hooks/useClientPortal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createNotification } from '@/hooks/useCreateNotification';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

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

interface ChatThread {
  id: string;
  team_member_id: string;
  team_member_name: string;
  team_member_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  conversation_id: string;
}

export function ClientMessaging() {
  const { user, profile } = useAuth();
  const { client } = useClientPortalData();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch team members (admins and team_members)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['client-team-members'],
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
        .eq('status', 'active');

      return (profiles || []) as TeamMember[];
    },
    enabled: !!user,
  });

  // Fetch chat threads - group by team member (single thread per team member like WhatsApp)
  const { data: chatThreads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['client-chat-threads', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];

      // Get all conversations for this client
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, team_member_id, updated_at')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return [];

      // Group conversations by team_member_id (take the most recent one per team member)
      const teamMemberConvMap = new Map<string, typeof conversations[0]>();
      conversations.forEach(conv => {
        if (conv.team_member_id && !teamMemberConvMap.has(conv.team_member_id)) {
          teamMemberConvMap.set(conv.team_member_id, conv);
        }
      });

      // Get unique team member IDs
      const teamMemberIds = Array.from(teamMemberConvMap.keys());
      if (teamMemberIds.length === 0) return [];

      // Get team member profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', teamMemberIds);

      // Get last message and unread count for each thread
      const threads: ChatThread[] = [];
      
      for (const [tmId, conv] of teamMemberConvMap.entries()) {
        const teamMemberProfile = profiles?.find(p => p.id === tmId);
        if (!teamMemberProfile) continue;

        // Get last message for this conversation
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
          id: tmId,
          team_member_id: tmId,
          team_member_name: teamMemberProfile.name,
          team_member_email: teamMemberProfile.email,
          last_message: lastMsg?.content || '',
          last_message_time: lastMsg?.created_at || conv.updated_at,
          unread_count: unreadCount || 0,
          conversation_id: conv.id,
        });
      }

      return threads.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
    },
    enabled: !!user && !!client?.id,
  });

  // Fetch messages for selected thread
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['client-thread-messages', selectedThread?.conversation_id],
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
    enabled: !!selectedThread?.conversation_id,
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedThread?.conversation_id) return;

    const channel = supabase
      .channel(`client-messages-${selectedThread.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedThread.conversation_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-thread-messages', selectedThread.conversation_id] });
          queryClient.invalidateQueries({ queryKey: ['client-chat-threads', client?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.conversation_id, queryClient, client?.id]);

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
          queryClient.invalidateQueries({ queryKey: ['client-chat-threads', client?.id] });
        });
    }
  }, [selectedThread?.conversation_id, user?.id, queryClient, client?.id]);

  const handleStartNewChat = async () => {
    if (!client?.id || !selectedTeamMember || !firstMessage.trim()) {
      toast({
        title: 'Cannot start conversation',
        description: client?.id ? 'Please select a team member and enter a message' : 'Your account is not linked to a client profile yet.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Check if conversation already exists with this team member
      const existingThread = chatThreads.find(t => t.team_member_id === selectedTeamMember);
      
      let conversationId: string;
      
      if (existingThread) {
        // Use existing conversation
        conversationId = existingThread.conversation_id;
      } else {
        // Create new conversation
        const teamMember = teamMembers.find(tm => tm.id === selectedTeamMember);
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: client.id,
            team_member_id: selectedTeamMember,
            subject: `Chat with ${teamMember?.name || 'Team Member'}`,
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
          client_id: client.id,
          receiver_id: selectedTeamMember,
          content: firstMessage.trim(),
        });

      if (msgError) throw msgError;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Create notification for the team member
      await createNotification({
        userId: selectedTeamMember,
        title: 'New Message from Client',
        message: `${profile?.name || 'A client'}: ${firstMessage.trim().substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}`,
        type: 'info',
        entityType: 'conversation',
        entityId: conversationId,
      });

      queryClient.invalidateQueries({ queryKey: ['client-chat-threads', client?.id] });
      
      // Find or create the thread to select
      const teamMember = teamMembers.find(tm => tm.id === selectedTeamMember);
      setSelectedThread({
        id: selectedTeamMember,
        team_member_id: selectedTeamMember,
        team_member_name: teamMember?.name || 'Team Member',
        team_member_email: teamMember?.email || '',
        last_message: firstMessage.trim(),
        last_message_time: new Date().toISOString(),
        unread_count: 0,
        conversation_id: conversationId,
      });
      
      setFirstMessage('');
      setSelectedTeamMember('');
      setIsNewOpen(false);
      toast({ title: 'Message sent' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim() || !client?.id) return;
    
    try {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedThread.conversation_id,
          sender_id: user?.id,
          client_id: client.id,
          receiver_id: selectedThread.team_member_id,
          content: newMessage.trim(),
          reply_to_id: replyingTo?.id || null,
        });

      if (msgError) throw msgError;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedThread.conversation_id);

      // Notify team member
      await createNotification({
        userId: selectedThread.team_member_id,
        title: 'New Message',
        message: `${profile?.name || 'Client'}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        type: 'info',
        entityType: 'conversation',
        entityId: selectedThread.conversation_id,
      });

      queryClient.invalidateQueries({ queryKey: ['client-thread-messages', selectedThread.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['client-chat-threads', client?.id] });
      setNewMessage('');
      setReplyingTo(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error sending message',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter out team members who already have a chat thread
  const availableTeamMembers = teamMembers.filter(
    tm => !chatThreads.some(t => t.team_member_id === tm.id)
  );
  const teamMemberOptions = availableTeamMembers.map((tm) => ({
    value: tm.id,
    label: tm.name,
  }));

  if (loadingThreads) {
    return (
      <Card className="border-2 border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Chat list view (like WhatsApp)
  if (!selectedThread) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>Chat with your legal team</CardDescription>
              </div>
              <Button onClick={() => setIsNewOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {chatThreads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No chats yet</p>
                <p className="text-sm">Start a new chat with a team member</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {chatThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {thread.team_member_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{thread.team_member_name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(thread.last_message_time), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {thread.last_message}
                        </p>
                        {thread.unread_count > 0 && (
                          <Badge variant="default" className="h-5 min-w-[20px] justify-center">
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

        {/* New Chat Dialog */}
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="border-2 border-border">
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
              <DialogDescription>
                Select a team member to chat with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Member</Label>
                <SearchableCombobox
                  options={teamMemberOptions}
                  value={selectedTeamMember}
                  onChange={setSelectedTeamMember}
                  placeholder="Select a team member..."
                  searchPlaceholder="Search team members..."
                />
                {teamMemberOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    You already have chats with all team members
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-message">Message</Label>
                <Textarea
                  id="first-message"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartNewChat}
                disabled={!selectedTeamMember || !firstMessage.trim()}
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Chat detail view (like WhatsApp conversation)
  return (
    <Card className="border-2 border-border">
      <CardHeader className="border-b-2 border-border py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedThread(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {selectedThread.team_member_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{selectedThread.team_member_name}</CardTitle>
            <CardDescription className="text-xs">{selectedThread.team_member_email}</CardDescription>
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
              <p>No messages yet. Start the conversation!</p>
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
                              {repliedMessage.sender_id === user?.id ? 'You' : selectedThread.team_member_name}
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
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5",
                                "text-sky-300"
                              )} />
                            ) : (
                              <Check className={cn(
                                "h-3.5 w-3.5",
                                "text-primary-foreground/70"
                              )} />
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
                  Replying to {replyingTo.sender_id === user?.id ? 'yourself' : selectedThread.team_member_name}
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
    </Card>
  );
}