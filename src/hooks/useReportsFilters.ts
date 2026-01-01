import { useState, useMemo } from 'react';
import { 
  startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from 'date-fns';

export type DateRangePreset = 
  | 'all'
  | 'today'
  | 'yesterday'
  | '3days'
  | 'thisWeek'
  | 'lastWeek'
  | '15days'
  | 'thisMonth'
  | 'lastMonth'
  | '3months'
  | '6months'
  | 'thisYear'
  | 'previousYear'
  | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

export const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '3days', label: 'Last 3 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: '15days', label: 'Last 15 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'previousYear', label: 'Previous Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function getDateRange(preset: DateRangePreset, customStart?: Date, customEnd?: Date): DateRange | null {
  const now = new Date();

  switch (preset) {
    case 'all':
      return null;
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case '3days':
      return { start: startOfDay(subDays(now, 2)), end: endOfDay(now) };
    case 'thisWeek':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'lastWeek':
      const lastWeek = subWeeks(now, 1);
      return { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    case '15days':
      return { start: startOfDay(subDays(now, 14)), end: endOfDay(now) };
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case '3months':
      return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
    case '6months':
      return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
    case 'thisYear':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'previousYear':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    case 'custom':
      if (customStart && customEnd) {
        return { start: startOfDay(customStart), end: endOfDay(customEnd) };
      }
      return null;
    default:
      return null;
  }
}

export function useReportsFilters() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const dateRange = useMemo(() => 
    getDateRange(datePreset, customStartDate, customEndDate),
    [datePreset, customStartDate, customEndDate]
  );

  const filterByDate = <T extends { created_at?: string; date?: string; payment_date?: string | null }>(
    items: T[],
    dateField: 'created_at' | 'date' | 'payment_date' = 'created_at'
  ): T[] => {
    if (!dateRange) return items;

    return items.filter(item => {
      const dateValue = item[dateField];
      if (!dateValue) return false;
      const date = new Date(dateValue);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
  };

  return {
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    dateRange,
    filterByDate,
  };
}
