import { useState } from 'react';
import { Users, Briefcase, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BulkAssignmentProps {
  type: 'cases' | 'clients';
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkAssignment({ type, selectedIds, onComplete }: BulkAssignmentProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-assignment'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'team_member']);

      if (rolesError) throw rolesError;

      const userIds = roles.map(r => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
        .eq('status', 'active');

      if (profilesError) throw profilesError;
      return profiles || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const table = type === 'cases' ? 'cases' : 'clients';
      
      const { error } = await supabase
        .from(table)
        .update({ assigned_to: selectedAssignee })
        .in('id', selectedIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
      toast({ title: `${selectedIds.length} ${type} assigned successfully` });
      setIsOpen(false);
      setSelectedAssignee('');
      onComplete();
    },
    onError: (error: Error) => {
      toast({ title: 'Error assigning', description: error.message, variant: 'destructive' });
    },
  });

  const memberOptions = teamMembers.map(m => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  if (selectedIds.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <UserCheck className="h-4 w-4" />
        Assign ({selectedIds.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === 'cases' ? <Briefcase className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              Bulk Assign {type === 'cases' ? 'Cases' : 'Clients'}
            </DialogTitle>
            <DialogDescription>
              Assign {selectedIds.length} {type} to a team member
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label>Assign to</Label>
              <SearchableCombobox
                options={memberOptions}
                value={selectedAssignee}
                onChange={setSelectedAssignee}
                placeholder="Select team member..."
                searchPlaceholder="Search team members..."
                emptyText="No team members found."
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Selected {type}: {selectedIds.length}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedAssignee || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : `Assign ${selectedIds.length} ${type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
