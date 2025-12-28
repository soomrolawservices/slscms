import { useState } from 'react';
import { Calendar, Clock, Phone, Video, Building2, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, addDays, startOfDay, isBefore } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useClientPortalData } from '@/hooks/useClientPortal';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

const APPOINTMENT_TYPES = [
  { value: 'in-office', label: 'In-Office Visit', icon: Building2 },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'video', label: 'Video Call', icon: Video },
];

export function ClientAppointmentBooking() {
  const { user, profile } = useAuth();
  const { client } = useClientPortalData();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    time: '',
    type: 'in-office',
    topic: '',
    notes: '',
  });

  // Fetch client's appointments
  const { data: clientAppointments = [] } = useQuery({
    queryKey: ['client-portal-appointments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!client?.id,
  });

  const bookAppointment = useMutation({
    mutationFn: async () => {
      if (!formData.date || !formData.time || !formData.topic) {
        throw new Error('Please fill in all required fields');
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          date: format(formData.date, 'yyyy-MM-dd'),
          time: formData.time,
          type: formData.type,
          topic: formData.topic,
          status: 'scheduled',
          client_id: client?.id,
          client_name: client?.name || profile?.name,
          client_email: client?.email || profile?.email,
          client_phone: client?.phone || profile?.phone,
          created_by: user?.id,
          assigned_to: null, // Admin will assign
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-appointments'] });
      toast({ title: 'Appointment request submitted', description: 'You will be notified once confirmed.' });
      setIsOpen(false);
      setFormData({
        date: undefined,
        time: '',
        type: 'in-office',
        topic: '',
        notes: '',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error booking appointment', description: error.message, variant: 'destructive' });
    },
  });

  const upcomingAppointments = clientAppointments.filter(
    a => !isBefore(new Date(a.date), startOfDay(new Date()))
  );

  const pastAppointments = clientAppointments.filter(
    a => isBefore(new Date(a.date), startOfDay(new Date()))
  );

  const TypeIcon = APPOINTMENT_TYPES.find(t => t.value === formData.type)?.icon || Building2;

  return (
    <div className="space-y-6">
      {/* Book New Appointment */}
      <Card className="border-2 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book Consultation
              </CardTitle>
              <CardDescription>Schedule a consultation with our legal team</CardDescription>
            </div>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 border-2 border-border rounded-lg"
                >
                  <div className={cn(
                    "p-3 rounded-lg",
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {appointment.type === 'phone' ? <Phone className="h-5 w-5" /> :
                     appointment.type === 'video' ? <Video className="h-5 w-5" /> :
                     <Building2 className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{appointment.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')} at {appointment.time}
                    </p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium capitalize",
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map(appointment => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="p-2 bg-muted rounded">
                    {appointment.type === 'phone' ? <Phone className="h-4 w-4 text-muted-foreground" /> :
                     appointment.type === 'video' ? <Video className="h-4 w-4 text-muted-foreground" /> :
                     <Building2 className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{appointment.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-2 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book a Consultation</DialogTitle>
            <DialogDescription>
              Schedule an appointment with Soomro Law Services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Appointment Type */}
            <div className="grid gap-2">
              <Label>Appointment Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {APPOINTMENT_TYPES.map(type => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.type === type.value ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                  >
                    <type.icon className="h-5 w-5" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid gap-2">
              <Label>Preferred Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-2 border-border" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    disabled={(date) => isBefore(date, startOfDay(new Date())) || date.getDay() === 0}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="grid gap-2">
              <Label>Preferred Time</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="border-2 border-border">
                  {TIME_SLOTS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="grid gap-2">
              <Label htmlFor="topic">Subject / Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Case review, Legal consultation"
                required
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bookAppointment.mutate()}
              disabled={!formData.date || !formData.time || !formData.topic || bookAppointment.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {bookAppointment.isPending ? 'Submitting...' : 'Request Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
