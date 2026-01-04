import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone, BellRing, FileText, Calendar, Receipt, Megaphone } from 'lucide-react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushSubscription, useSubscribeToPush, useUnsubscribeFromPush } from '@/hooks/usePushNotifications';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationPreferencesSettings() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { data: pushSubscription } = usePushSubscription();
  const subscribeToPush = useSubscribeToPush();
  const unsubscribeFromPush = useUnsubscribeFromPush();

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;
    updatePreferences.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const deliveryChannels = [
    { key: 'email_enabled' as const, label: 'Email Notifications', description: 'Receive notifications via email', icon: Mail },
    { key: 'push_enabled' as const, label: 'Push Notifications', description: 'Browser push notifications (even when app is closed)', icon: BellRing },
    { key: 'sms_enabled' as const, label: 'SMS Notifications', description: 'Receive important alerts via SMS', icon: Smartphone },
  ];

  const notificationTypes = [
    { key: 'case_updates' as const, label: 'Case Updates', description: 'Status changes, new activities, assignments', icon: FileText },
    { key: 'document_uploads' as const, label: 'Document Uploads', description: 'New documents uploaded to your cases', icon: FileText },
    { key: 'appointment_reminders' as const, label: 'Appointment Reminders', description: 'Upcoming appointment notifications', icon: Calendar },
    { key: 'invoice_alerts' as const, label: 'Invoice Alerts', description: 'New invoices and payment reminders', icon: Receipt },
    { key: 'message_notifications' as const, label: 'Messages', description: 'New messages from clients or team', icon: MessageSquare },
    { key: 'system_announcements' as const, label: 'System Announcements', description: 'Important system updates and maintenance', icon: Megaphone },
  ];

  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <div className="space-y-6">
      {/* Delivery Channels */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Delivery Channels
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {deliveryChannels.map((channel) => (
            <div key={channel.key} className="flex items-center justify-between py-4 first:pt-6 last:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <channel.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-base">{channel.label}</Label>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              {channel.key === 'push_enabled' ? (
                <div className="flex items-center gap-2">
                  {isPushSupported ? (
                    pushSubscription ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unsubscribeFromPush.mutate()}
                        disabled={unsubscribeFromPush.isPending}
                      >
                        {unsubscribeFromPush.isPending ? 'Disabling...' : 'Disable Push'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => subscribeToPush.mutate()}
                        disabled={subscribeToPush.isPending}
                      >
                        {subscribeToPush.isPending ? 'Enabling...' : 'Enable Push'}
                      </Button>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Not supported</span>
                  )}
                </div>
              ) : (
                <Switch
                  checked={preferences?.[channel.key] ?? true}
                  onCheckedChange={(checked) => handleToggle(channel.key, checked)}
                  disabled={updatePreferences.isPending}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b border-border">
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Select which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between py-4 first:pt-6 last:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <type.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-base">{type.label}</Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences?.[type.key] ?? true}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
                disabled={updatePreferences.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
