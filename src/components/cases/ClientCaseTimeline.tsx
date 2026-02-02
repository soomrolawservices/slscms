import { format, formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  PlusCircle, 
  RefreshCw,
  Upload,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';
import { useCaseActivities } from '@/hooks/useCaseActivities';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClientCaseTimelineProps {
  cases: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

const activityConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
}> = {
  created: { icon: PlusCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
  status_change: { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-500' },
  updated: { icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-500' },
  comment: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-500' },
  document: { icon: Upload, color: 'text-indigo-600', bgColor: 'bg-indigo-500' },
  assignment: { icon: UserCheck, color: 'text-orange-600', bgColor: 'bg-orange-500' },
};

const statusProgress: Record<string, number> = {
  'new': 10,
  'in_progress': 40,
  'under_review': 60,
  'pending': 50,
  'resolved': 90,
  'closed': 100,
};

function CaseTimelineItem({ caseData }: { caseData: { id: string; title: string; status: string; created_at: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: activities = [], isLoading } = useCaseActivities(caseData.id);
  const progress = statusProgress[caseData.status.toLowerCase()] || 25;

  return (
    <Card className={cn(
      "border transition-all duration-200 overflow-hidden",
      isOpen ? "shadow-md border-primary/30" : "hover:shadow-sm"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-5">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200",
                isOpen ? "bg-primary" : "bg-primary/10",
              )}>
                <Activity className={cn(
                  "h-5 w-5 transition-colors",
                  isOpen ? "text-primary-foreground" : "text-primary"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <CardTitle className="text-base font-semibold truncate">{caseData.title}</CardTitle>
                  <ChevronRight 
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={caseData.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{progress}%</span>
                    <Progress value={progress} className="w-20 h-1.5" />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 px-5">
            <div className="border-t pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
                  
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity, index) => {
                      const config = activityConfig[activity.activity_type] || {
                        icon: Clock,
                        color: 'text-muted-foreground',
                        bgColor: 'bg-muted',
                      };
                      const Icon = config.icon;
                      
                      return (
                        <div key={activity.id} className="relative flex gap-3 group">
                          <div className={cn(
                            "relative z-10 flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-transform",
                            config.bgColor,
                            "group-hover:scale-110"
                          )}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                            )}
                            <time className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                            </time>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {activities.length > 5 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        +{activities.length - 5} more activities
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function ClientCaseTimeline({ cases }: ClientCaseTimelineProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Clock className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-semibold mb-1">No Cases Found</p>
        <p className="text-sm text-muted-foreground">Your cases will appear here once created</p>
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
