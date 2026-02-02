import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Activity, 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Calendar, 
  Receipt,
  MessageSquare,
  Shield,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  entity_type: string;
  action: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_id: string | null;
}

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  client: Users,
  case: Briefcase,
  document: FileText,
  payment: CreditCard,
  appointment: Calendar,
  invoice: Receipt,
  message: MessageSquare,
  permission: Shield,
  setting: Settings,
};

const actionColors: Record<string, string> = {
  created: 'bg-green-500',
  updated: 'bg-blue-500',
  deleted: 'bg-red-500',
  status_change: 'bg-yellow-500',
  assignment: 'bg-purple-500',
  default: 'bg-muted-foreground',
};

export function useActivityLogs(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
  const Icon = entityIcons[activity.entity_type] || Activity;
  const actionColor = actionColors[activity.action] || actionColors.default;

  const getActivityMessage = () => {
    const details = activity.details as Record<string, any> | null;
    const entityName = details?.name || details?.title || activity.entity_id?.slice(0, 8);
    
    switch (activity.action) {
      case 'created':
        return `New ${activity.entity_type} "${entityName}" was created`;
      case 'updated':
        return `${activity.entity_type} "${entityName}" was updated`;
      case 'deleted':
        return `${activity.entity_type} "${entityName}" was deleted`;
      case 'status_change':
        return `${activity.entity_type} status changed to ${details?.new_status || 'unknown'}`;
      case 'assignment':
        return `${activity.entity_type} was reassigned`;
      default:
        return `${activity.action} on ${activity.entity_type}`;
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", actionColor)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">{getActivityMessage()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

export function ActivityFeed({ limit = 10, className }: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useActivityLogs(limit);

  return (
    <Card className={cn("border-2 border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
