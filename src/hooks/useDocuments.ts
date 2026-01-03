import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { notifyTeamMembersForClient, notifyClientUser } from './useNotificationService';

export interface DocumentData {
  id: string;
  title: string;
  document_type: string | null;
  file_path: string | null;
  file_size: number | null;
  client_id: string | null;
  case_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  clients?: { name: string } | null;
  cases?: { title: string } | null;
}

export function useDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, clients(name), cases(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentData[];
    },
    enabled: !!user,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      file, 
      title, 
      client_id, 
      case_id, 
      document_type 
    }: { 
      file: File; 
      title: string; 
      client_id: string; 
      case_id?: string; 
      document_type?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${client_id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title,
          document_type: document_type || fileExt?.toUpperCase(),
          file_path: filePath,
          file_size: file.size,
          client_id,
          case_id: case_id || null,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-log document upload activity for the case
      if (case_id) {
        await supabase.from('case_activities').insert({
          case_id,
          activity_type: 'document',
          title: 'Document uploaded',
          description: `"${title}" has been uploaded to this case`,
          user_id: user?.id,
          metadata: { document_id: data.id, document_type: document_type || fileExt?.toUpperCase(), file_size: file.size }
        });
      }

      return { ...data, client_id };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['case_activities'] });
      toast({ title: 'Document uploaded successfully' });

      // Notify team members
      if (data.client_id) {
        await notifyTeamMembersForClient(
          data.client_id,
          'Document Uploaded',
          `Document "${data.title}" has been uploaded by ${profile?.name || 'a team member'}`,
          'info',
          'document',
          data.id,
          user?.id
        );

        // Notify the client
        await notifyClientUser(
          data.client_id,
          'New Document Available',
          `A new document "${data.title}" has been uploaded for you`,
          'info',
          'document',
          data.id
        );
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error uploading document', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string | null }) => {
      // Delete from storage if file exists
      if (file_path) {
        await supabase.storage.from('documents').remove([file_path]);
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (file_path: string) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(file_path);

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({ title: 'Error downloading document', description: error.message, variant: 'destructive' });
    },
  });
}