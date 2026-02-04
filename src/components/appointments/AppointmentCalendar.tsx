import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, Building, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AppointmentData } from '@/hooks/useAppointments';

interface AppointmentCalendarProps {
  appointments: AppointmentData[];
  onSelectAppointment?: (appointment: AppointmentData) => void;
  onSelectDate?: (date: Date) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  'in-office': Building,
  outdoor: MapPin,
  virtual: Video,
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-accent text-accent-foreground',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
  pending: 'bg-warning/20 text-warning-foreground',
};

export function AppointmentCalendar({ appointments, onSelectAppointment, onSelectDate }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const days = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, view]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, AppointmentData[]> = {};
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.date), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(apt);
    });
    return map;
  }, [appointments]);

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            {view === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`
            }
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className="text-xs"
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="text-xs"
              >
                Week
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none border-l-0" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
          {weekDays.map((day) => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={cn(
          "grid grid-cols-7",
          view === 'month' ? 'auto-rows-[100px] sm:auto-rows-[120px]' : 'auto-rows-[200px]'
        )}>
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={idx}
                className={cn(
                  "border-b border-r border-border/30 p-1 sm:p-2 cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden",
                  !isCurrentMonth && view === 'month' && 'bg-muted/20 text-muted-foreground',
                  isToday && 'bg-accent/5'
                )}
                onClick={() => onSelectDate?.(day)}
              >
                <div className={cn(
                  "text-xs sm:text-sm font-medium mb-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full",
                  isToday && 'bg-accent text-accent-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-y-auto max-h-[60px] sm:max-h-[80px]">
                  {dayAppointments.slice(0, view === 'week' ? 5 : 3).map((apt) => {
                    const Icon = typeIcons[apt.type] || Building;
                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment?.(apt);
                        }}
                        className={cn(
                          "text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                          statusColors[apt.status] || 'bg-muted'
                        )}
                        title={`${apt.time} - ${apt.topic}`}
                      >
                        <Icon className="h-3 w-3 flex-shrink-0 hidden sm:block" />
                        <span className="truncate">{apt.time} {apt.topic}</span>
                      </div>
                    );
                  })}
                  {dayAppointments.length > (view === 'week' ? 5 : 3) && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{dayAppointments.length - (view === 'week' ? 5 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-border/50 flex flex-wrap gap-3 text-xs bg-muted/20">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-accent" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning/60" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/30" />
            <span>Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
