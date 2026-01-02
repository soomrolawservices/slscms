import { format } from 'date-fns';
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  PlusCircle, 
  RefreshCw,
  Upload
} from 'lucide-react';
import { useCaseActivities, CaseActivity } from '@/hooks/useCaseActivities';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CaseTimelineProps {
  caseId: string;
}

const activityIcons: Record<string, React.ElementType> = {
  created: PlusCircle,
  status_change: RefreshCw,
  updated: FileText,
  comment: MessageSquare,
  document: Upload,
  assignment: UserCheck,
};

const activityColors: Record<string, string> = {
  created: 'bg-green-500',
  status_change: 'bg-blue-500',
  updated: 'bg-yellow-500',
  comment: 'bg-purple-500',
  document: 'bg-indigo-500',
  assignment: 'bg-orange-500',
};

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const { data: activities = [], isLoading } = useCaseActivities(caseId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No activity recorded yet</p>
        <p className="text-sm">Activities will appear here as the case progresses</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.activity_type] || Clock;
            const colorClass = activityColors[activity.activity_type] || 'bg-muted';
            
            return (
              <div key={activity.id} className="relative flex gap-4 pl-2">
                {/* Icon */}
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${colorClass} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </time>
                  </div>
                  
                  {/* Metadata display */}
                  {activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata) && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      {Object.entries(activity.metadata as Record<string, unknown>).map(([key, value]) => (
                        <span key={key} className="inline-block mr-3">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                          {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
