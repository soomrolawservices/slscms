import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'clients' | 'cases' | 'documents' | 'invoices' | 'expenses' | 'payments';
  onImport: (data: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
}

const TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  clients: {
    headers: ['name', 'client_type', 'phone', 'email', 'cnic', 'region', 'status'],
    example: ['John Doe', 'individual', '+923001234567', 'john@example.com', '12345-1234567-1', 'Lahore', 'active'],
  },
  cases: {
    headers: ['title', 'client_name', 'status', 'description'],
    example: ['Property Dispute Case', 'John Doe', 'open', 'Land ownership dispute in DHA Phase 5'],
  },
  documents: {
    headers: ['title', 'client_name', 'document_type'],
    example: ['Contract Agreement', 'John Doe', 'Contract'],
  },
  invoices: {
    headers: ['client_name', 'amount', 'due_date', 'status', 'line_items'],
    example: ['John Doe', '50000', '2024-12-31', 'unpaid', 'Legal Consultation:25000;Court Filing:25000'],
  },
  expenses: {
    headers: ['title', 'amount', 'date', 'category', 'status'],
    example: ['Office Supplies', '5000', '2024-01-15', 'Office Supplies', 'pending'],
  },
  payments: {
    headers: ['client_name', 'title', 'amount', 'payment_date', 'status'],
    example: ['John Doe', 'Retainer Fee', '100000', '2024-01-20', 'completed'],
  },
};

export function BulkImportDialog({ open, onOpenChange, entityType, onImport }: BulkImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const template = TEMPLATES[entityType];

  const downloadTemplate = () => {
    const csvContent = [
      template.headers.join(','),
      template.example.join(','),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({ title: 'Invalid CSV', description: 'File must have headers and at least one data row', variant: 'destructive' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const data: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }

      setParsedData(data);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 200);

    try {
      const result = await onImport(parsedData);
      setImportResult(result);
      setProgress(100);
      setStep('complete');
    } catch (error) {
      toast({ title: 'Import failed', description: (error as Error).message, variant: 'destructive' });
      setStep('preview');
    } finally {
      clearInterval(progressInterval);
    }
  };

  const reset = () => {
    setStep('upload');
    setParsedData([]);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple {entityType} at once.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">CSV files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Need a template?</p>
                <p className="text-xs text-muted-foreground">Download our CSV template with required columns</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required columns:</p>
              <div className="flex flex-wrap gap-2">
                {template.headers.map(header => (
                  <span key={header} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                    {header}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{parsedData.length} records found</span>
            </div>

            <ScrollArea className="h-64 border-2 border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    {Object.keys(parsedData[0] || {}).map(key => (
                      <th key={key} className="px-3 py-2 text-left font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 truncate max-w-[150px]">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... and {parsedData.length - 10} more rows
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              Importing {parsedData.length} records...
            </p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">{importResult.success} records imported successfully</p>
                {importResult.errors.length > 0 && (
                  <p className="text-sm text-muted-foreground">{importResult.errors.length} records failed</p>
                )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <ScrollArea className="h-32 border-2 border-destructive/20 rounded-lg p-3">
                <div className="space-y-2">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport}>
                Import {parsedData.length} Records
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
