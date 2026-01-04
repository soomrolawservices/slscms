import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save, Eye, Settings2, Send, Pencil, MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCustomForms,
  useCreateForm,
  useUpdateForm,
  useDeleteForm,
  useAssignForm,
  useFormSubmissions,
  type FormField,
  type CustomForm,
} from '@/hooks/useCustomForms';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useClients } from '@/hooks/useClients';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
  { value: 'radio', label: 'Radio Buttons' },
];

function FormFieldEditor({
  field,
  onUpdate,
  onDelete,
}: {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-2 border-border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              placeholder="Field label"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <SearchableCombobox
              options={FIELD_TYPES}
              value={field.type}
              onChange={(value) => onUpdate({ ...field, type: value as FormField['type'] })}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
              />
              <Label className="text-xs">Required</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {(field.type === 'select' || field.type === 'radio') && (
        <div>
          <Label className="text-xs">Options (comma-separated)</Label>
          <Input
            value={field.options?.join(', ') || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}
      {field.type === 'text' && (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Enter placeholder text..."
          />
        </div>
      )}
    </div>
  );
}

export function FormBuilder() {
  const { data: forms = [], isLoading } = useCustomForms();
  const { data: submissions = [] } = useFormSubmissions();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: clients = [] } = useClients();
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();
  const assignForm = useAssignForm();

  const [activeTab, setActiveTab] = useState('forms');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const resetEditor = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('draft');
    setFormFields([]);
    setSelectedForm(null);
  };

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addField = () => {
    setFormFields([
      ...formFields,
      {
        id: generateFieldId(),
        type: 'text',
        label: '',
        required: false,
      },
    ]);
  };

  const updateField = (index: number, field: FormField) => {
    const updated = [...formFields];
    updated[index] = field;
    setFormFields(updated);
  };

  const deleteField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleEditForm = (form: CustomForm) => {
    setSelectedForm(form);
    setFormTitle(form.title);
    setFormDescription(form.description || '');
    setFormStatus(form.status);
    setFormFields(form.fields);
    setIsEditorOpen(true);
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      toast({ title: 'Please enter a form title', variant: 'destructive' });
      return;
    }

    if (formFields.length === 0) {
      toast({ title: 'Please add at least one field', variant: 'destructive' });
      return;
    }

    // Validate all fields have labels
    const invalidFields = formFields.filter(f => !f.label.trim());
    if (invalidFields.length > 0) {
      toast({ title: 'All fields must have labels', variant: 'destructive' });
      return;
    }

    if (selectedForm) {
      await updateForm.mutateAsync({
        id: selectedForm.id,
        title: formTitle,
        description: formDescription,
        status: formStatus as 'draft' | 'active' | 'archived',
        fields: formFields,
      });
    } else {
      await createForm.mutateAsync({
        title: formTitle,
        description: formDescription,
        fields: formFields,
        status: formStatus,
      });
    }

    setIsEditorOpen(false);
    resetEditor();
  };

  const handleAssignForm = async () => {
    if (!selectedForm || !assignTo) return;
    
    await assignForm.mutateAsync({
      form_id: selectedForm.id,
      assigned_to: assignTo,
      due_date: assignDueDate || undefined,
    });

    setIsAssignOpen(false);
    setAssignTo('');
    setAssignDueDate('');
    setSelectedForm(null);
  };

  const handleDeleteForm = async () => {
    if (!selectedForm) return;
    await deleteForm.mutateAsync(selectedForm.id);
    setIsDeleteOpen(false);
    setSelectedForm(null);
  };

  const userOptions = [
    ...teamMembers.map(tm => ({ value: tm.id, label: `${tm.name} (Team)` })),
    ...clients.map(c => ({ value: c.id, label: `${c.name} (Client)` })),
  ];

  const formColumns: Column<CustomForm>[] = [
    {
      key: 'title',
      header: 'Form Title',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'fields',
      header: 'Fields',
      render: (row) => <span>{row.fields.length} fields</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  return (
    <Card className="border-2 border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Custom Forms
            </CardTitle>
            <CardDescription>Create and manage custom forms for data collection</CardDescription>
          </div>
          <Button onClick={() => { resetEditor(); setIsEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-2 border-border mb-4">
            <TabsTrigger value="forms">Forms ({forms.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="forms">
            <DataTable
              data={forms}
              columns={formColumns}
              searchPlaceholder="Search forms..."
              searchKey="title"
              isLoading={isLoading}
              actions={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditForm(row)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSelectedForm(row); setIsAssignOpen(true); }}>
                      <Send className="h-4 w-4 mr-2" />
                      Assign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setSelectedForm(row); setIsDeleteOpen(true); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </TabsContent>

          <TabsContent value="submissions">
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No form submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Submitted: {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-48">
                        {JSON.stringify(submission.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Form Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="border-2 border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm ? 'Edit Form' : 'Create New Form'}</DialogTitle>
            <DialogDescription>Design your custom form with drag-and-drop fields</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Form Title *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Client Feedback Form"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of the form..."
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <SearchableCombobox
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  value={formStatus}
                  onChange={setFormStatus}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Form Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {formFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">No fields added yet. Click "Add Field" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <FormFieldEditor
                      key={field.id}
                      field={field}
                      onUpdate={(updated) => updateField(index, updated)}
                      onDelete={() => deleteField(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} disabled={createForm.isPending || updateForm.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createForm.isPending || updateForm.isPending ? 'Saving...' : 'Save Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Form Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Assign Form</DialogTitle>
            <DialogDescription>Assign "{selectedForm?.title}" to a user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Assign To *</Label>
              <SearchableCombobox
                options={userOptions}
                value={assignTo}
                onChange={setAssignTo}
                placeholder="Select a user..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="datetime-local"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignForm} disabled={assignForm.isPending || !assignTo}>
              {assignForm.isPending ? 'Assigning...' : 'Assign Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteForm}
        title="Delete Form"
        description={`Are you sure you want to delete "${selectedForm?.title}"? This will also delete all submissions.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </Card>
  );
}
