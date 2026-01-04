import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/radio fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface CustomForm {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  status: 'draft' | 'active' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormAssignment {
  id: string;
  form_id: string;
  assigned_to: string;
  assigned_by: string | null;
  due_date: string | null;
  status: 'pending' | 'completed' | 'overdue';
  created_at: string;
  form?: CustomForm;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  assignment_id: string | null;
  submitted_by: string;
  data: Record<string, unknown>;
  files: string[];
  submitted_at: string;
}

export function useCustomForms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(form => ({
        ...form,
        fields: (form.fields as unknown as FormField[]) || [],
      })) as CustomForm[];
    },
    enabled: !!user,
  });
}

export function useMyFormAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['form-assignments', 'my'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_assignments')
        .select('*, custom_forms(*)')
        .eq('assigned_to', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(assignment => ({
        ...assignment,
        form: assignment.custom_forms ? {
          ...assignment.custom_forms,
          fields: (assignment.custom_forms.fields as unknown as FormField[]) || [],
        } : undefined,
      })) as FormAssignment[];
    },
    enabled: !!user,
  });
}

export function useFormSubmissions(formId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      let query = supabase
        .from('form_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (formId) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FormSubmission[];
    },
    enabled: !!user,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; fields: FormField[]; status?: string }) => {
      const { data: result, error } = await supabase
        .from('custom_forms')
        .insert({
          title: data.title,
          description: data.description,
          fields: JSON.parse(JSON.stringify(data.fields)),
          status: data.status || 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast({ title: 'Form created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating form', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomForm> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.fields !== undefined) updateData.fields = JSON.parse(JSON.stringify(updates.fields));
      
      const { data, error } = await supabase
        .from('custom_forms')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast({ title: 'Form updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating form', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast({ title: 'Form deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting form', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAssignForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { form_id: string; assigned_to: string; due_date?: string }) => {
      const { data: result, error } = await supabase
        .from('form_assignments')
        .insert({
          form_id: data.form_id,
          assigned_to: data.assigned_to,
          due_date: data.due_date,
          assigned_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-assignments'] });
      toast({ title: 'Form assigned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error assigning form', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSubmitForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: { form_id: string; assignment_id?: string; data: Record<string, unknown>; files?: string[] }) => {
      const { data: result, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formData.form_id,
          assignment_id: formData.assignment_id,
          submitted_by: user?.id || '',
          data: JSON.parse(JSON.stringify(formData.data)),
          files: JSON.parse(JSON.stringify(formData.files || [])),
        })
        .select()
        .single();

      if (error) throw error;

      // Update assignment status if applicable
      if (formData.assignment_id) {
        await supabase
          .from('form_assignments')
          .update({ status: 'completed' })
          .eq('id', formData.assignment_id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['form-assignments'] });
      toast({ title: 'Form submitted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error submitting form', description: error.message, variant: 'destructive' });
    },
  });
}
