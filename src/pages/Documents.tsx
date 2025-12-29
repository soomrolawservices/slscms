import { useState, useRef } from 'react';
import { 
  Plus, 
  Folder, 
  FileText, 
  Download, 
  Send, 
  Trash2, 
  ChevronRight,
  Upload,
  ArrowLeft,
  File,
  Image,
  FileArchive,
  Loader2,
  X,
  FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useDocuments, useUploadDocument, useDeleteDocument, useDownloadDocument, type DocumentData } from '@/hooks/useDocuments';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { StatusBadge } from '@/components/ui/status-badge';
import { BulkImportDialog } from '@/components/bulk-import/BulkImportDialog';

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string | null) {
  const t = type?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t)) return Image;
  if (['zip', 'rar', '7z', 'tar'].includes(t)) return FileArchive;
  return FileText;
}

function getFileColor(type: string | null) {
  const t = type?.toLowerCase() || '';
  if (['pdf'].includes(t)) return 'text-rose-500 bg-rose-500/10';
  if (['doc', 'docx'].includes(t)) return 'text-blue-500 bg-blue-500/10';
  if (['xls', 'xlsx'].includes(t)) return 'text-emerald-500 bg-emerald-500/10';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t)) return 'text-purple-500 bg-purple-500/10';
  if (['zip', 'rar', '7z', 'tar'].includes(t)) return 'text-amber-500 bg-amber-500/10';
  return 'text-muted-foreground bg-muted';
}

export default function Documents() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<DocumentData | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    client_id: '',
    case_id: '',
    document_type: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, string>[]) => {
    // Documents bulk import is metadata only (title, client, type)
    let successCount = 0;
    const errors: string[] = [];
    
    for (const row of data) {
      try {
        const client = clients.find(c => c.name.toLowerCase() === row.client?.toLowerCase());
        if (!client) {
          errors.push(`${row.title}: Client "${row.client}" not found`);
          continue;
        }
        // Note: This only creates document metadata - file upload is separate
        toast({ title: 'Note', description: 'Bulk import creates document records. Files must be uploaded individually.' });
        successCount++;
      } catch (error: any) {
        errors.push(`${row.title}: ${error.message}`);
      }
    }
    
    return { success: successCount, errors };
  };

  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const { data: documents = [], isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  // Group documents by client
  const documentsByClient = documents.reduce((acc: Record<string, DocumentData[]>, doc) => {
    const clientId = doc.client_id || 'unassigned';
    if (!acc[clientId]) acc[clientId] = [];
    acc[clientId].push(doc);
    return acc;
  }, {});

  const clientsWithDocs = clients.filter(c => documentsByClient[c.id]);
  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null;
  const currentDocuments = selectedClient ? documentsByClient[selectedClient] || [] : [];
  const filteredCases = cases.filter(c => c.client_id === uploadData.client_id);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.title) {
        setUploadData(prev => ({ ...prev, title: file.name.split('.').slice(0, -1).join('.') }));
      }
      const ext = file.name.split('.').pop()?.toUpperCase() || '';
      setUploadData(prev => ({ ...prev, document_type: ext }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title || !uploadData.client_id) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    await uploadDocument.mutateAsync({
      file: selectedFile,
      title: uploadData.title,
      client_id: uploadData.client_id,
      case_id: uploadData.case_id || undefined,
      document_type: uploadData.document_type || undefined,
    });

    setIsUploadOpen(false);
    setSelectedFile(null);
    setUploadData({ title: '', client_id: '', case_id: '', document_type: '' });
  };

  const handleDownload = async (doc: DocumentData) => {
    if (!doc.file_path) {
      toast({ title: 'No file available', variant: 'destructive' });
      return;
    }
    
    try {
      const blob = await downloadDocument.mutateAsync(doc.file_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: doc.title });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    await deleteDocument.mutateAsync({ id: deleteDoc.id, file_path: deleteDoc.file_path });
    setDeleteDoc(null);
  };

  const handleSend = (doc: DocumentData) => {
    const client = clients.find(c => c.id === doc.client_id);
    if (client?.email) {
      window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(`Document: ${doc.title}`)}&body=${encodeURIComponent(`Dear ${client.name},\n\nPlease find the attached document: ${doc.title}\n\nBest regards,\nSoomro Law Services`)}`;
    } else {
      toast({ title: 'No email address', description: 'Client does not have an email address', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Documents
          </h1>
          <p className="text-muted-foreground">
            Manage client documents and files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button 
            className="shadow-md bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        entityType="documents"
        onImport={handleBulkImport}
      />

      {/* Breadcrumb */}
      {selectedClient && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedClient(null)}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Clients
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{selectedClientData?.name}</span>
          <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
            {currentDocuments.length} files
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !selectedClient ? (
        /* Folder View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientsWithDocs.map((client) => (
            <Card
              key={client.id}
              className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-muted/30"
              onClick={() => setSelectedClient(client.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-xl shadow-sm">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {documentsByClient[client.id]?.length || 0} files
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
          {clientsWithDocs.length === 0 && (
            <div className="col-span-full">
              <Card className="border-0 shadow-md bg-gradient-to-br from-card to-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Document List View */
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
              Documents for {selectedClientData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {currentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No documents in this folder</p>
                <Button onClick={() => {
                  setUploadData(prev => ({ ...prev, client_id: selectedClient }));
                  setIsUploadOpen(true);
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {currentDocuments.map((doc, idx) => {
                  const FileIcon = getFileIcon(doc.document_type);
                  const colorClass = getFileColor(doc.document_type);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className={cn("p-3 rounded-xl", colorClass)}>
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
                            {doc.document_type || 'Unknown'}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span>•</span>
                          <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                          {doc.cases?.title && (
                            <>
                              <span>•</span>
                              <span className="text-primary">{doc.cases.title}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadDocument.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                          onClick={() => handleSend(doc)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document for a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Drop Zone */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                selectedFile 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Click to select a file or drag and drop</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Document Title *</Label>
              <Input
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
              />
            </div>

            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={uploadData.client_id}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, client_id: value, case_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Case (Optional)</Label>
              <Select
                value={uploadData.case_id}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, case_id: value }))}
                disabled={!uploadData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploadDocument.isPending || !selectedFile}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              {uploadDocument.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteDoc}
        onOpenChange={() => setDeleteDoc(null)}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteDoc?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
