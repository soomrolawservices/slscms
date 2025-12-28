import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  appointmentTopic: string;
  currentReminderMinutes?: number | null;
}

const reminderOptions = [
  { value: '15', label: '15 minutes before', icon: Clock },
  { value: '30', label: '30 minutes before', icon: Clock },
  { value: '60', label: '1 hour before', icon: Clock },
  { value: '120', label: '2 hours before', icon: Clock },
  { value: '1440', label: '1 day before', icon: Clock },
  { value: '2880', label: '2 days before', icon: Clock },
];

export function ReminderDialog({ 
  open, 
  onOpenChange, 
  appointmentId, 
  appointmentTopic,
  currentReminderMinutes 
}: ReminderDialogProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(
    currentReminderMinutes?.toString() || '60'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSetReminder = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: {
          appointmentId,
          reminderMinutes: parseInt(selectedMinutes),
        },
      });

      if (error) throw error;

      toast({
        title: 'Reminder Set',
        description: `You and the client will be notified ${reminderOptions.find(r => r.value === selectedMinutes)?.label}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error setting reminder:', error);
      toast({
        title: 'Error setting reminder',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Set Appointment Reminder
          </DialogTitle>
          <DialogDescription>
            Choose when you and the client should be reminded about "{appointmentTopic}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">Remind before appointment:</Label>
          <RadioGroup
            value={selectedMinutes}
            onValueChange={setSelectedMinutes}
            className="grid grid-cols-2 gap-3"
          >
            {reminderOptions.map((option) => (
              <label
                key={option.value}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedMinutes === option.value 
                    ? 'border-primary bg-primary/10 shadow-sm' 
                    : 'hover:border-primary/50 hover:bg-muted/30'
                  }
                `}
              >
                <RadioGroupItem value={option.value} />
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{option.label}</span>
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Email Notification</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reminder emails will be sent to the client and assigned team member at the selected time before the appointment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSetReminder} 
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary/90"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
