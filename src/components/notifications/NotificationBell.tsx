import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import type { Notification } from '@/types';

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New case assigned',
    message: 'You have been assigned to case #2024-001',
    type: 'info',
    read: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Payment received',
    message: 'Payment of $5,000 received from Client A',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '3',
    title: 'Appointment reminder',
    message: 'Meeting with Client B in 1 hour',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 7200000),
  },
];

export function NotificationBell() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border-2 border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {!notification.read && (
                  <span className="h-2 w-2 bg-primary flex-shrink-0" />
                )}
                <span className="font-medium text-sm">{notification.title}</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
