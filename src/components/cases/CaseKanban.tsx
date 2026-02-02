import { useState } from 'react';
import { Briefcase, GripVertical, Eye, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCases, useUpdateCase } from '@/hooks/useCases';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CaseWithClient {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string } | null;
}

const statusColumns = [
  { id: 'active', label: 'Active', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { id: 'pending', label: 'Pending', color: 'bg-orange-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' },
  { id: 'archived', label: 'Archived', color: 'bg-muted-foreground' },
];

interface CaseCardProps {
  caseItem: CaseWithClient;
  onDragStart: (e: React.DragEvent, caseId: string) => void;
  onView?: (caseItem: CaseWithClient) => void;
}

function CaseCard({ caseItem, onDragStart, onView }: CaseCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, caseItem.id)}
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{caseItem.title}</h4>
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(caseItem);
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {caseItem.clients?.name && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{caseItem.clients.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(caseItem.updated_at), 'MMM d')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof statusColumns[0];
  cases: CaseWithClient[];
  onDragStart: (e: React.DragEvent, caseId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  isDragOver: boolean;
  onViewCase?: (caseItem: CaseWithClient) => void;
}

function KanbanColumn({ column, cases, onDragStart, onDragOver, onDrop, isDragOver, onViewCase }: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3 transition-colors",
        isDragOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-2 w-2 rounded-full", column.color)} />
        <h3 className="font-semibold text-sm">{column.label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {cases.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 pr-2">
          {cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onDragStart={onDragStart}
              onView={onViewCase}
            />
          ))}
          {cases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No cases
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CaseKanbanProps {
  onViewCase?: (caseItem: CaseWithClient) => void;
}

export function CaseKanban({ onViewCase }: CaseKanbanProps) {
  const { data: cases = [], isLoading } = useCases();
  const updateCase = useUpdateCase();
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, caseId: string) => {
    setDraggedCaseId(caseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedCaseId) return;
    
    const caseItem = (cases as CaseWithClient[]).find(c => c.id === draggedCaseId);
    if (!caseItem || caseItem.status === status) {
      setDraggedCaseId(null);
      return;
    }

    await updateCase.mutateAsync({
      id: draggedCaseId,
      status,
    });
    
    setDraggedCaseId(null);
  };

  const getCasesByStatus = (status: string) => {
    return (cases as CaseWithClient[]).filter(c => c.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3 animate-pulse">
            <div className="h-6 w-24 bg-muted rounded mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5" />
          Case Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {statusColumns.map((column) => (
              <div
                key={column.id}
                onDragEnter={() => handleDragEnter(column.id)}
                onDragLeave={() => setDragOverColumn(null)}
              >
                <KanbanColumn
                  column={column}
                  cases={getCasesByStatus(column.id)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragOver={dragOverColumn === column.id}
                  onViewCase={onViewCase}
                />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
