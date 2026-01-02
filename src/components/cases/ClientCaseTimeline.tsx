import { format } from 'date-fns';
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  PlusCircle, 
  RefreshCw,
  Upload,
  ChevronRight
} from 'lucide-react';
import { useCaseActivities } from '@/hooks/useCaseActivities';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ClientCaseTimelineProps {
  cases: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
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

function CaseTimelineItem({ caseData }: { caseData: { id: string; title: string; status: string; created_at: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: activities = [], isLoading } = useCaseActivities(caseData.id);

  return (
    <Card className="border border-border/50 shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <ChevronRight 
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{caseData.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opened {format(new Date(caseData.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <StatusBadge status={caseData.status} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {isLoading ? (
              <div className="space-y-3 pl-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm pl-4">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No activity recorded yet</p>
              </div>
            ) : (
              <div className="relative pl-4">
                {/* Timeline line */}
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => {
                    const Icon = activityIcons[activity.activity_type] || Clock;
                    const colorClass = activityColors[activity.activity_type] || 'bg-muted';
                    
                    return (
                      <div key={activity.id} className="relative flex gap-3">
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${colorClass} text-white shadow-sm shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                          )}
                          <time className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                          </time>
                        </div>
                      </div>
                    );
                  })}
                  {activities.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pl-8">
                      +{activities.length - 5} more activities
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function ClientCaseTimeline({ cases }: ClientCaseTimelineProps) {
  if (cases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No cases found</p>
        <p className="text-sm">Your cases will appear here once created</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {cases.map((caseData) => (
          <CaseTimelineItem key={caseData.id} caseData={caseData} />
        ))}
      </div>
    </ScrollArea>
  );
}
