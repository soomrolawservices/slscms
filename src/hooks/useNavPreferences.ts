import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const PREFERENCE_KEY = 'mobile_nav_tabs';
const LOCAL_STORAGE_KEY = 'nav_preferences';
const MAX_TABS = 4;

// Default tab IDs
const DEFAULT_TAB_IDS = ['dashboard', 'clients', 'cases', 'appointments'];

// All available navigation items with their IDs
export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', title: 'Home', url: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'clients', title: 'Clients', url: '/clients', icon: 'Users' },
  { id: 'cases', title: 'Cases', url: '/cases', icon: 'Briefcase' },
  { id: 'appointments', title: 'Schedule', url: '/appointments', icon: 'Calendar' },
  { id: 'documents', title: 'Documents', url: '/documents', icon: 'FileText' },
  { id: 'payments', title: 'Payments', url: '/payments', icon: 'CreditCard' },
  { id: 'invoices', title: 'Invoices', url: '/invoices', icon: 'Receipt' },
  { id: 'expenses', title: 'Expenses', url: '/expenses', icon: 'Wallet' },
  { id: 'messages', title: 'Messages', url: '/messages', icon: 'MessageSquare' },
  { id: 'credentials', title: 'Credentials', url: '/credentials', icon: 'Key' },
  { id: 'assignments', title: 'Assignments', url: '/assignments', icon: 'UserPlus' },
  { id: 'reports', title: 'Reports', url: '/reports', icon: 'BarChart3' },
  { id: 'users', title: 'Users', url: '/users', icon: 'UserCog' },
  { id: 'permissions', title: 'Permissions', url: '/permissions', icon: 'Shield' },
  { id: 'settings', title: 'Settings', url: '/settings', icon: 'Settings' },
];

export function useNavPreferences() {
  const { user } = useAuth();
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>(DEFAULT_TAB_IDS);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      // First try localStorage for instant loading
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === MAX_TABS) {
            setSelectedTabIds(parsed);
          }
        } catch {
          // Invalid cache, ignore
        }
      }

      // Then fetch from database if user is logged in
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', user.id)
            .eq('preference_key', PREFERENCE_KEY)
            .maybeSingle();

          if (!error && data?.preference_value) {
            const tabIds = data.preference_value as string[];
            if (Array.isArray(tabIds) && tabIds.length === MAX_TABS) {
              setSelectedTabIds(tabIds);
              // Update localStorage cache
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tabIds));
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error loading nav preferences:', error);
          }
        }
      }

      setIsLoading(false);
    };

    loadPreferences();
  }, [user?.id]);

  // Save preferences
  const savePreferences = useCallback(async (tabIds: string[]) => {
    if (tabIds.length !== MAX_TABS) {
      throw new Error(`Must select exactly ${MAX_TABS} tabs`);
    }

    // Update local state immediately
    setSelectedTabIds(tabIds);
    
    // Update localStorage cache
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tabIds));

    // Save to database if user is logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preference_key: PREFERENCE_KEY,
            preference_value: tabIds,
          }, {
            onConflict: 'user_id,preference_key',
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error saving nav preferences:', error);
        }
        throw error;
      }
    }
  }, [user?.id]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    await savePreferences(DEFAULT_TAB_IDS);
  }, [savePreferences]);

  // Get selected items with full details
  const selectedTabs = selectedTabIds
    .map(id => ALL_NAV_ITEMS.find(item => item.id === id))
    .filter((item): item is NavItem => item !== undefined);

  // Get available items (not in selected)
  const availableTabs = ALL_NAV_ITEMS.filter(
    item => !selectedTabIds.includes(item.id)
  );

  return {
    selectedTabIds,
    selectedTabs,
    availableTabs,
    isLoading,
    savePreferences,
    resetToDefaults,
    MAX_TABS,
    DEFAULT_TAB_IDS,
  };
}
