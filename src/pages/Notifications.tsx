import { useState } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, Calendar, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type NotificationData } from '@/hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string, entityType: string | null) => {
  if (entityType === 'appointment') return <Calendar className="h-5 w-5" />;
  if (entityType === 'payment' || entityType === 'invoice') return <CreditCard className="h-5 w-5" />;
  if (entityType === 'expense') return <FileText className="h-5 w-5" />;
  
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'error':
      return <AlertCircle className="h-5 w-5" />;
    case 'success':
      return <Check className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-primary bg-primary/10 border-primary/20';
  }
};

function NotificationCard({ notification, onMarkAsRead }: { notification: NotificationData; onMarkAsRead: (id: string) => void }) {
  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-sm",
      notification.is_read ? "bg-muted/30" : "bg-card"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg border",
            getNotificationColor(notification.type)
          )}>
            {getNotificationIcon(notification.type, notification.entity_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn(
                  "font-medium",
                  notification.is_read && "text-muted-foreground"
                )}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              {notification.entity_type && (
                <Badge variant="outline" className="text-xs">
                  {notification.entity_type}
                </Badge>
              )}
              {!notification.is_read && (
                <Badge className="text-xs bg-primary">New</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            View and manage your notification history
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription>Unread</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription>Read</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">
              {notifications.length - unreadCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-1">No notifications</h3>
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'unread' 
                    ? "You're all caught up!" 
                    : "No notifications to display"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
