import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Trash2, Bell, Video, Building, MapPin, Check, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableDataTable, type EditableColumn } from '@/components/ui/editable-data-table';
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
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ReminderDialog } from '@/components/appointments/ReminderDialog';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  'in-office': Building,
  outdoor: MapPin,
  virtual: Video,
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const TYPE_OPTIONS = [
  { value: 'in-office', label: 'In Office' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'virtual', label: 'Virtual' },
];

export default function Appointments() {
  const { user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: clients = [] } = useClients();
  const { data: teamMembers = [] } = useTeamMembers();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [activeTab, setActiveTab] = useState('scheduled');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [assignToId, setAssignToId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const columns: EditableColumn<AppointmentData>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      editable: false,
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
      sortable: true,
      editable: true,
      editType: 'text',
      bulkEditable: false,
    },
    {
      key: 'client_name',
      header: 'Client',
      editable: false,
      render: (row) => row.client_name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      editable: true,
      editType: 'select',
      options: TYPE_OPTIONS,
      bulkEditable: true,
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'status',
      options: STATUS_OPTIONS,
      bulkEditable: true,
    },
  ];

  const handleFieldUpdate = async (id: string, key: string, value: string) => {
    await updateAppointment.mutateAsync({ id, [key]: value });
  };

  const handleBulkUpdate = async (ids: string[], updates: Record<string, string>) => {
    for (const id of ids) {
      await updateAppointment.mutateAsync({ id, ...updates });
    }
  };

  const handleView = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsViewOpen(true);
  };

  const handleSetReminder = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsReminderOpen(true);
  };

  const handleDeleteClick = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setIsDeleteOpen(true);
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

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    await deleteAppointment.mutateAsync(selectedAppointment.id);
    setIsDeleteOpen(false);
    setSelectedAppointment(null);
  };

  const handleApproveClick = (apt: AppointmentData) => {
    setSelectedAppointment(apt);
    setAssignToId(user?.id || '');
    setIsApproveOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedAppointment || !assignToId) return;
    await updateAppointment.mutateAsync({
      id: selectedAppointment.id,
      status: 'scheduled',
      assigned_to: assignToId,
    });
    const assignedMember = teamMembers.find(m => m.id === assignToId);
    toast({ title: `Appointment approved and assigned to ${assignedMember?.name || 'team member'}` });
    setIsApproveOpen(false);
    setSelectedAppointment(null);
    setAssignToId('');
  };

  const teamMemberOptions = teamMembers.map(m => ({ value: m.id, label: m.name }));

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
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "rounded-none h-9 px-3",
                viewMode === 'list' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={cn(
                "rounded-none h-9 px-3 border-l border-border",
                viewMode === 'calendar' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsCreateOpen(true); }} 
            className="shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          onSelectAppointment={(apt) => {
            setSelectedAppointment(apt);
            setIsViewOpen(true);
          }}
          onSelectDate={(date) => {
            setFormData(prev => ({
              ...prev,
              date: format(date, 'yyyy-MM-dd')
            }));
            setIsCreateOpen(true);
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            <EditableDataTable
              data={filteredAppointments}
              columns={columns}
              searchPlaceholder="Search appointments..."
              searchKey="topic"
              title="Appointments"
              isLoading={isLoading}
              onUpdate={handleFieldUpdate}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onBulkUpdate={handleBulkUpdate}
              isUpdating={updateAppointment.isPending}
              actions={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border border-border">
                    <DropdownMenuItem onClick={() => handleView(row)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    {row.status === 'pending' && (
                      <DropdownMenuItem 
                        onClick={() => handleApproveClick(row)}
                        className="text-accent"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve & Assign
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleSetReminder(row)}
                      className="text-primary"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Set Reminder
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
      )}


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

      {/* Approve & Assign Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Approve & Assign Appointment</DialogTitle>
            <DialogDescription>
              Select a team member to assign this appointment to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Assign To</Label>
            <SearchableCombobox
              options={teamMemberOptions}
              value={assignToId}
              onChange={setAssignToId}
              placeholder="Select team member..."
              searchPlaceholder="Search team members..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproveConfirm} 
              disabled={!assignToId || updateAppointment.isPending}
            >
              {updateAppointment.isPending ? 'Approving...' : 'Approve & Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
