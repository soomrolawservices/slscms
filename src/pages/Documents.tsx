import { useState } from 'react';
import { 
  Plus, 
  Folder, 
  FileText, 
  Download, 
  Send, 
  Trash2, 
  ChevronRight,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockClients } from '@/data/mockData';
import type { Document } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock documents organized by client
const mockDocuments: Record<string, Document[]> = {
  '1': [
    { id: '1', title: 'Contract Agreement.pdf', type: 'PDF', size: 2048000, uploadDate: new Date('2024-06-01'), clientId: '1', caseId: 'CASE-2024-001', url: '#' },
    { id: '2', title: 'Evidence Photos.zip', type: 'ZIP', size: 15360000, uploadDate: new Date('2024-06-05'), clientId: '1', caseId: 'CASE-2024-001', url: '#' },
    { id: '3', title: 'Legal Brief.docx', type: 'DOCX', size: 512000, uploadDate: new Date('2024-06-10'), clientId: '1', url: '#' },
  ],
  '2': [
    { id: '4', title: 'Property Deed.pdf', type: 'PDF', size: 1024000, uploadDate: new Date('2024-06-15'), clientId: '2', caseId: 'CASE-2024-002', url: '#' },
    { id: '5', title: 'ID Documents.pdf', type: 'PDF', size: 768000, uploadDate: new Date('2024-06-16'), clientId: '2', url: '#' },
  ],
  '5': [
    { id: '6', title: 'Patent Application.pdf', type: 'PDF', size: 4096000, uploadDate: new Date('2024-06-20'), clientId: '5', caseId: 'CASE-2024-005', url: '#' },
    { id: '7', title: 'Technical Specs.xlsx', type: 'XLSX', size: 256000, uploadDate: new Date('2024-06-21'), clientId: '5', url: '#' },
  ],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Documents() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  const clientsWithDocs = mockClients.filter(c => mockDocuments[c.id]);

  const handleDownload = (doc: Document) => {
    toast({
      title: 'Downloading',
      description: `Starting download of ${doc.title}`,
    });
  };

  const handleSend = (doc: Document) => {
    toast({
      title: 'Send Document',
      description: `Opening email composer for ${doc.title}`,
    });
  };

  const handleDelete = (doc: Document) => {
    toast({
      title: 'Document deleted',
      description: `${doc.title} has been removed.`,
    });
  };

  const selectedClientData = selectedClient 
    ? mockClients.find(c => c.id === selectedClient) 
    : null;

  const documents = selectedClient ? mockDocuments[selectedClient] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Documents
          </h1>
          <p className="text-muted-foreground">
            Manage client documents and files
          </p>
        </div>
        <Button className="shadow-xs">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

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
        </div>
      )}

      {/* Folder View */}
      {!selectedClient ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientsWithDocs.map((client) => (
            <Card
              key={client.id}
              className="border-2 border-border cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => setSelectedClient(client.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary text-primary-foreground">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockDocuments[client.id]?.length || 0} files
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
          {clientsWithDocs.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No documents uploaded yet
            </div>
          )}
        </div>
      ) : (
        /* Document List View */
        <Card className="border-2 border-border">
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="text-lg">
              Documents for {selectedClientData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No documents in this folder
              </div>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-2 bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type} • {formatFileSize(doc.size)} • {format(doc.uploadDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSend(doc)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
