import { format, formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  PlusCircle, 
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useCaseActivities, CaseActivity } from '@/hooks/useCaseActivities';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CaseTimelineProps {
  caseId: string;
}

const activityConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  created: { 
    icon: PlusCircle, 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-500',
    label: 'Case Created'
  },
  status_change: { 
    icon: RefreshCw, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-500',
    label: 'Status Changed'
  },
  updated: { 
    icon: FileText, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500',
    label: 'Updated'
  },
  comment: { 
    icon: MessageSquare, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-500',
    label: 'Comment Added'
  },
  document: { 
    icon: Upload, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-500',
    label: 'Document Uploaded'
  },
  assignment: { 
    icon: UserCheck, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-500',
    label: 'Assigned'
  },
  milestone: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    label: 'Milestone'
  },
};

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const { data: activities = [], isLoading } = useCaseActivities(caseId);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Clock className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No Activity Yet</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Activities will appear here as the case progresses through its lifecycle
        </p>
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, CaseActivity[]>);

  return (
    <ScrollArea className="h-[450px]">
      <div className="relative px-2">
        {/* Main timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent" />
        
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date} className="relative">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-8 bg-primary/10 rounded-full border border-primary/30">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {format(new Date(date), 'EEEE, MMMM d')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(date), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Day's activities */}
              <div className="space-y-4 ml-1">
                {dayActivities.map((activity, index) => {
                  const config = activityConfig[activity.activity_type] || {
                    icon: Clock,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    label: 'Activity'
                  };
                  const Icon = config.icon;
                  const isLast = index === dayActivities.length - 1;
                  
                  return (
                    <div key={activity.id} className="relative flex gap-4 group">
                      {/* Timeline node */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl shadow-sm transition-all duration-200",
                          config.bgColor,
                          "group-hover:scale-110 group-hover:shadow-md"
                        )}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {!isLast && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 h-6 bg-border/50" />
                        )}
                      </div>
                      
                      {/* Content card */}
                      <div className={cn(
                        "flex-1 bg-card border rounded-xl p-4 transition-all duration-200",
                        "hover:shadow-md hover:border-primary/30",
                        "group-hover:translate-x-1"
                      )}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cn("text-xs font-medium", config.color)}>
                              {config.label}
                            </Badge>
                          </div>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(activity.created_at), 'h:mm a')}
                          </time>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1">{activity.title}</h4>
                        
                        {activity.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {activity.description}
                          </p>
                        )}
                        
                        {/* Metadata display */}
                        {activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata) && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(activity.metadata as Record<string, unknown>).map(([key, value]) => (
                              <div 
                                key={key} 
                                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md"
                              >
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
