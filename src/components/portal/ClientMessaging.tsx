import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, Check, CheckCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useConversations, useMessages, useCreateConversation, useSendMessage, useMarkMessagesRead } from '@/hooks/useMessages';
import { useClientPortalData } from '@/hooks/useClientPortal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createNotification } from '@/hooks/useCreateNotification';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export function ClientMessaging() {
  const { user, profile } = useAuth();
  const { client } = useClientPortalData();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
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

  const { data: conversations = [], isLoading: loadingConversations } = useConversations(client?.id);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedConversation || '');
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`client-messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
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

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversation) {
      markRead.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleCreateConversation = async () => {
    if (!client?.id || !newSubject.trim() || !firstMessage.trim()) return;
    
    try {
      // Create conversation with team member
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: client.id,
          team_member_id: selectedTeamMember || null,
          subject: newSubject.trim(),
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
          client_id: client.id,
          receiver_id: selectedTeamMember || null,
          content: firstMessage.trim(),
        });

      if (msgError) throw msgError;

      // Create notification for the team member
      if (selectedTeamMember) {
        await createNotification({
          userId: selectedTeamMember,
          title: 'New Message from Client',
          message: `${profile?.name || 'A client'} started a conversation: ${newSubject.trim()}`,
          type: 'info',
          entityType: 'conversation',
          entityId: conv.id,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewSubject('');
      setFirstMessage('');
      setSelectedTeamMember('');
      setIsNewOpen(false);
      setSelectedConversation(conv.id);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !client?.id) return;
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    
    await sendMessage.mutateAsync({
      conversationId: selectedConversation,
      content: newMessage.trim(),
      clientId: client.id,
      receiverId: conversation?.team_member_id || undefined,
    });

    // Notify team member
    if (conversation?.team_member_id) {
      await createNotification({
        userId: conversation.team_member_id,
        title: 'New Message',
        message: `${profile?.name || 'Client'}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        type: 'info',
        entityType: 'conversation',
        entityId: selectedConversation,
      });
    }
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const teamMemberOptions = teamMembers.map((tm) => ({
    value: tm.id,
    label: tm.name,
  }));

  // Count unread messages per conversation
  const getUnreadCount = (conversationId: string) => {
    return messages.filter(m => m.conversation_id === conversationId && !m.is_read && m.sender_id !== user?.id).length;
  };

  if (loadingConversations) {
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

  // Conversation list view
  if (!selectedConversation) {
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
                <CardDescription>Communicate with your legal team</CardDescription>
              </div>
              <Button onClick={() => setIsNewOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new conversation to get help</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className="p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{conv.subject}</h4>
                      <Badge variant={conv.status === 'open' ? 'default' : 'secondary'}>
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(conv.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Conversation Dialog */}
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="border-2 border-border">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Send a message to a team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Member (Optional)</Label>
                <SearchableCombobox
                  options={teamMemberOptions}
                  value={selectedTeamMember}
                  onChange={setSelectedTeamMember}
                  placeholder="Select a team member..."
                  searchPlaceholder="Search team members..."
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to send to all team members
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Question about my case"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-message">Message</Label>
                <Input
                  id="first-message"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Type your message..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateConversation}
                disabled={!newSubject.trim() || !firstMessage.trim()}
              >
                Start Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Conversation detail view
  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <Card className="border-2 border-border">
      <CardHeader className="border-b-2 border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">{currentConversation?.subject}</CardTitle>
            <CardDescription>
              Started {currentConversation && format(new Date(currentConversation.created_at), 'MMM d, yyyy')}
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
              <p>No messages yet. Start the conversation!</p>
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
                            <CheckCheck className={cn("h-3 w-3", "text-primary-foreground/70")} />
                          ) : (
                            <Check className={cn("h-3 w-3", "text-primary-foreground/70")} />
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
              placeholder="Type your message..."
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
    </Card>
  );
}
