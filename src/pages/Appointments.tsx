import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Bell, Video, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockAppointments, mockClients } from '@/data/mockData';
import type { Appointment } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIcons = {
  in_office: Building,
  outdoor: MapPin,
  virtual: Video,
};

export default function Appointments() {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = appointments.filter((apt) =>
    activeTab === 'all' ? true : apt.status === activeTab
  );

  const columns: Column<Appointment>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{format(row.date, 'MMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground">{row.time}</p>
        </div>
      ),
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (row) => <span className="font-medium">{row.topic}</span>,
    },
    {
      key: 'clientName',
      header: 'Client',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const Icon = typeIcons[row.type];
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="capitalize">{row.type.replace('_', ' ')}</span>
          </div>
        );
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => <span>{row.duration} min</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsViewOpen(true);
  };

  const handleDelete = (apt: Appointment) => {
    setAppointments(appointments.filter((a) => a.id !== apt.id));
    toast({
      title: 'Appointment deleted',
      description: 'The appointment has been removed.',
    });
  };

  const handleSetReminder = (apt: Appointment) => {
    toast({
      title: 'Reminder set',
      description: `You'll be notified before the appointment with ${apt.clientName}.`,
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const client = mockClients.find(c => c.id === formData.get('clientId'));
    
    const newAppointment: Appointment = {
      id: String(Date.now()),
      date: new Date(formData.get('date') as string),
      time: formData.get('time') as string,
      topic: formData.get('topic') as string,
      duration: parseInt(formData.get('duration') as string) || 60,
      type: formData.get('type') as Appointment['type'],
      clientId: client?.id || '',
      clientName: client?.name || '',
      clientPhone: client?.phone || '',
      clientEmail: client?.email || '',
      platform: formData.get('platform') as string || undefined,
      status: 'scheduled',
    };
    
    setAppointments([newAppointment, ...appointments]);
    setIsCreateOpen(false);
    toast({
      title: 'Appointment scheduled',
      description: `Meeting with ${newAppointment.clientName} has been scheduled.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Manage your schedule and meetings
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredAppointments}
            columns={columns}
            searchPlaceholder="Search appointments..."
            searchKey="topic"
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem onClick={() => handleView(row)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetReminder(row)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Enter the appointment details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" name="topic" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border">
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-2 border-border">
                      <SelectItem value="in_office">In Office</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input id="duration" name="duration" type="number" defaultValue={60} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform (if virtual)</Label>
                <Input id="platform" name="platform" placeholder="e.g., Zoom, Google Meet" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Topic</p>
                  <p className="font-medium">{selectedAppointment.topic}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedAppointment.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(selectedAppointment.date, 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedAppointment.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {selectedAppointment.type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedAppointment.clientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAppointment.clientEmail}</p>
                </div>
                {selectedAppointment.platform && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium">{selectedAppointment.platform}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
