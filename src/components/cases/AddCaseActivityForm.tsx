import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { useCreateCaseActivity } from '@/hooks/useCaseActivities';
import { toast } from '@/hooks/use-toast';

interface AddCaseActivityFormProps {
  caseId: string;
  onSuccess?: () => void;
}

const activityTypes = [
  { value: 'comment', label: 'Comment' },
  { value: 'status_change', label: 'Status Update' },
  { value: 'document', label: 'Document Added' },
  { value: 'updated', label: 'General Update' },
];

export function AddCaseActivityForm({ caseId, onSuccess }: AddCaseActivityFormProps) {
  const [activityType, setActivityType] = useState('comment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createActivity = useCreateCaseActivity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    await createActivity.mutateAsync({
      case_id: caseId,
      activity_type: activityType,
      title: title.trim(),
      description: description.trim() || undefined,
    });

    toast({ title: 'Activity added successfully' });
    setTitle('');
    setDescription('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Activity Type</Label>
        <SearchableCombobox
          options={activityTypes}
          value={activityType}
          onChange={setActivityType}
          placeholder="Select type..."
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="activity-title">Title</Label>
        <Input
          id="activity-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of the activity"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="activity-description">Description (Optional)</Label>
        <Textarea
          id="activity-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
          rows={3}
        />
      </div>
      
      <Button type="submit" disabled={createActivity.isPending} className="w-full">
        {createActivity.isPending ? 'Adding...' : 'Add Activity'}
      </Button>
    </form>
  );
}
