import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DropdownOption {
  id: string;
  category: string;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number | null;
}

export function useDropdownOptions(category: string) {
  return useQuery({
    queryKey: ['dropdown-options', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DropdownOption[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useAllDropdownOptions() {
  return useQuery({
    queryKey: ['dropdown-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Group by category
      const grouped = data.reduce((acc, option) => {
        if (!acc[option.category]) {
          acc[option.category] = [];
        }
        acc[option.category].push(option);
        return acc;
      }, {} as Record<string, DropdownOption[]>);
      
      return grouped;
    },
    staleTime: 1000 * 60 * 5,
  });
}