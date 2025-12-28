import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  FileText,
  CreditCard,
  Receipt,
  Key,
  UserCog,
  Shield,
  Settings,
  Wallet,
  UserPlus,
  BarChart3,
  MessageSquare,
  GripVertical,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { useNavPreferences, ALL_NAV_ITEMS, type NavItem } from '@/hooks/useNavPreferences';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  CreditCard,
  Receipt,
  Key,
  UserCog,
  Shield,
  Settings,
  Wallet,
  UserPlus,
  BarChart3,
  MessageSquare,
};

interface NavCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavCustomizer({ open, onOpenChange }: NavCustomizerProps) {
  const { 
    selectedTabIds, 
    savePreferences, 
    resetToDefaults,
    MAX_TABS,
    DEFAULT_TAB_IDS,
    isLoading 
  } = useNavPreferences();

  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTabIds);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when preferences load
  useEffect(() => {
    setLocalSelectedIds(selectedTabIds);
  }, [selectedTabIds]);

  const handleToggleItem = (itemId: string) => {
    if (localSelectedIds.includes(itemId)) {
      // Remove item
      if (localSelectedIds.length > 1) {
        setLocalSelectedIds(prev => prev.filter(id => id !== itemId));
      }
    } else {
      // Add item (replace oldest if at max)
      if (localSelectedIds.length >= MAX_TABS) {
        setLocalSelectedIds(prev => [...prev.slice(1), itemId]);
      } else {
        setLocalSelectedIds(prev => [...prev, itemId]);
      }
    }
  };

  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = localSelectedIds.indexOf(itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localSelectedIds.length) return;

    const newIds = [...localSelectedIds];
    [newIds[currentIndex], newIds[newIndex]] = [newIds[newIndex], newIds[currentIndex]];
    setLocalSelectedIds(newIds);
  };

  const handleSave = async () => {
    if (localSelectedIds.length !== MAX_TABS) {
      toast({
        title: 'Select 4 tabs',
        description: `Please select exactly ${MAX_TABS} tabs for the navigation bar.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await savePreferences(localSelectedIds);
      toast({
        title: 'Saved',
        description: 'Navigation preferences updated.',
      });
      onOpenChange(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setLocalSelectedIds(DEFAULT_TAB_IDS);
  };

  const getItemById = (id: string): NavItem | undefined => {
    return ALL_NAV_ITEMS.find(item => item.id === id);
  };

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className={className} /> : null;
  };

  const availableItems = ALL_NAV_ITEMS.filter(item => !localSelectedIds.includes(item.id));

  if (isLoading) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-card">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-lg font-semibold">Customize Navigation</DrawerTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which {MAX_TABS} tabs appear in your bottom navigation bar
          </p>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Selected Tabs */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Selected Tabs ({localSelectedIds.length}/{MAX_TABS})
            </h3>
            <div className="space-y-2">
              {localSelectedIds.map((id, index) => {
                const item = getItemById(id);
                if (!item) return null;
                
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        {renderIcon(item.icon, 'h-4 w-4 text-primary')}
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveItem(id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveItem(id, 'down')}
                        disabled={index === localSelectedIds.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleToggleItem(id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {/* Empty slots */}
              {Array.from({ length: MAX_TABS - localSelectedIds.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted text-muted-foreground"
                >
                  <div className="w-4" />
                  <span className="text-sm">Tap an item below to add</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Tabs */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Available Tabs
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  disabled={localSelectedIds.length >= MAX_TABS}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                    localSelectedIds.length >= MAX_TABS
                      ? "opacity-50 cursor-not-allowed border-border"
                      : "border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  <div className="p-2 rounded-lg bg-muted">
                    {renderIcon(item.icon, 'h-4 w-4 text-muted-foreground')}
                  </div>
                  <span className="text-xs font-medium text-center">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button 
              className="flex-1 gap-2" 
              onClick={handleSave}
              disabled={isSaving || localSelectedIds.length !== MAX_TABS}
            >
              <Check className="h-4 w-4" />
              Save
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
