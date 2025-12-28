import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Bell, Video, Building, MapPin, Mail, Check, UserPlus } from 'lucide-react';
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
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, type AppointmentData } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ReminderDialog } from '@/components/appointments/ReminderDialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const typeIcons: Record<string, React.ElementType> = {
  'in-office': Building,
  outdoor: MapPin,
  virtual: Video,
};

export default function Appointments() {
  const { user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: clients = [] } = useClients();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [activeTab, setActiveTab] = useState('scheduled');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    topic: '',
    duration: 60,
    type: 'in-office',
    client_id: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    platform: '',
    status: 'scheduled',
  });

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      topic: '',
      duration: 60,
      type: 'in-office',
      client_id: '',
      client_name: '',
      client_phone: '',
      client_email: '',
      platform: '',
      status: 'scheduled',
    });
  };

  const filteredAppointments = appointments.filter((apt) =>
    activeTab === 'all' ? true : apt.status === activeTab
  );

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client_id: clientId,
        client_name: client.name,
        client_phone: client.phone || '',
        client_email: client.email || '',
      });
    }
  };

  const columns: Column<AppointmentData>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{format(new Date(row.date), 'MMM d, yyyy')}</p>
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
      key: 'client_name',
      header: 'Client',
      render: (row) => row.client_name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const Icon = typeIcons[row.type] || Building;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="capitalize">{row.type.replace('-', ' ')}</span>
          </div>
        );
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => <span>{row.duration || 60} min</span>,
    },
    {
      key: 'reminder_minutes',
      header: 'Reminder',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.reminder_sent ? (
            <StatusBadge status="completed" />
          ) : row.reminder_minutes ? (
            <span className="text-xs text-primary font-medium">
              {row.reminder_minutes >= 60 
                ? `${row.reminder_minutes / 60}h before` 
                : `${row.reminder_minutes}m before`}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">Not set</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleView = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsViewOpen(true);
  };

  const handleEdit = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setFormData({
      date: apt.date.split('T')[0],
      time: apt.time,
      topic: apt.topic,
      duration: apt.duration || 60,
      type: apt.type,
      client_id: apt.client_id || '',
      client_name: apt.client_name || '',
      client_phone: apt.client_phone || '',
      client_email: apt.client_email || '',
      platform: apt.platform || '',
      status: apt.status,
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsDeleteOpen(true);
  };

  const handleSetReminder = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsReminderOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAppointment.mutateAsync({
      date: formData.date,
      time: formData.time,
      topic: formData.topic,
      duration: formData.duration,
      type: formData.type,
      client_id: formData.client_id || null,
      client_name: formData.client_name || null,
      client_phone: formData.client_phone || null,
      client_email: formData.client_email || null,
      platform: formData.platform || null,
      status: 'scheduled',
      reminder_minutes: null,
      reminder_sent: null,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    await updateAppointment.mutateAsync({
      id: selectedAppointment.id,
      date: formData.date,
      time: formData.time,
      topic: formData.topic,
      duration: formData.duration,
      type: formData.type,
      client_id: formData.client_id || null,
      client_name: formData.client_name || null,
      client_phone: formData.client_phone || null,
      client_email: formData.client_email || null,
      platform: formData.platform || null,
      status: formData.status,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    await deleteAppointment.mutateAsync(selectedAppointment.id);
    setIsDeleteOpen(false);
    setSelectedAppointment(null);
  };

  const handleApprove = async (apt: AppointmentData) => {
    await updateAppointment.mutateAsync({
      id: apt.id,
      status: 'scheduled',
      assigned_to: user?.id,
    });
    toast({ title: 'Appointment approved and assigned to you' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Appointments
          </h1>
          <p className="text-muted-foreground">
            Manage your schedule and meetings
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }} 
          className="shadow-md bg-gradient-to-r from-primary to-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
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
            title="Appointments"
            isLoading={isLoading}
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
                  {row.status === 'pending' && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => handleApprove(row)}
                        className="text-green-600"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve & Assign to Me
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleSetReminder(row)}
                    className="text-primary"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(row)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteClick(row)}
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
                <Input 
                  id="topic" 
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={handleClientChange}
                  placeholder="Select client..."
                  searchPlaceholder="Search clients..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <SearchableCombobox
                    options={[
                      { value: 'in-office', label: 'In Office' },
                      { value: 'outdoor', label: 'Outdoor' },
                      { value: 'virtual', label: 'Virtual' },
                    ]}
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              {formData.type === 'virtual' && (
                <div className="grid gap-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input 
                    id="platform" 
                    placeholder="e.g., Zoom, Google Meet"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAppointment.isPending}>
                {createAppointment.isPending ? 'Scheduling...' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-topic">Topic</Label>
                <Input 
                  id="edit-topic" 
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <SearchableCombobox
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={handleClientChange}
                  placeholder="Select client..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input 
                    id="edit-date" 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input 
                    id="edit-time" 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <SearchableCombobox
                    options={[
                      { value: 'in-office', label: 'In Office' },
                      { value: 'outdoor', label: 'Outdoor' },
                      { value: 'virtual', label: 'Virtual' },
                    ]}
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <SearchableCombobox
                    options={[
                      { value: 'pending', label: 'Pending Approval' },
                      { value: 'scheduled', label: 'Scheduled (Approved)' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAppointment.isPending}>
                {updateAppointment.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedAppointment.client_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedAppointment.type.replace('-', ' ')}</p>
                </div>
              </div>
              {selectedAppointment.client_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Client Email</p>
                  <p className="font-medium">{selectedAppointment.client_email}</p>
                </div>
              )}
              <div className="pt-4 border-t flex gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleSetReminder(selectedAppointment);
                  }}
                >
                  <Bell className="h-4 w-4" />
                  Set Reminder
                </Button>
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleEdit(selectedAppointment);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Cancel Appointment"
        description={`Are you sure you want to cancel this appointment with ${selectedAppointment?.client_name}?`}
        onConfirm={handleDelete}
      />

      {/* Reminder Dialog */}
      {selectedAppointment && (
        <ReminderDialog
          open={isReminderOpen}
          onOpenChange={setIsReminderOpen}
          appointmentId={selectedAppointment.id}
          appointmentTopic={selectedAppointment.topic}
          currentReminderMinutes={selectedAppointment.reminder_minutes}
        />
      )}
    </div>
  );
}
