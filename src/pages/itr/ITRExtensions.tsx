import { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useITRFiscalYears, useITRExtensions, useUpdateITRReturn } from '@/hooks/useITRPortal';
import { toast } from '@/hooks/use-toast';

export default function ITRExtensions() {
  const { data: fiscalYears = [] } = useITRFiscalYears();
  const [selectedYear, setSelectedYear] = useState<string>(fiscalYears[0]?.id || '');
  const { data: extensions = [], isLoading } = useITRExtensions(selectedYear);
  const updateReturn = useUpdateITRReturn();

  const columns: Column<any>[] = [
    { key: 'sr', header: 'SR.', render: (row) => extensions.indexOf(row) + 1 },
    { key: 'client', header: 'Client Name', render: (row) => row.clients?.name || '-' },
    {
      key: 'extension_status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.extension_status} />,
    },
    { key: 'year', header: 'Year', render: (row) => row.itr_fiscal_years?.year_label || '-' },
  ];

  const handleApprove = async (row: any) => {
    await updateReturn.mutateAsync({ id: row.id, extension_status: 'approved' });
    toast({ title: 'Extension approved' });
  };

  const handleReject = async (row: any) => {
    await updateReturn.mutateAsync({ id: row.id, extension_status: 'rejected' });
    toast({ title: 'Extension rejected' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">ITR Extensions</h1>
        <p className="text-muted-foreground">Manage extension requests for tax return filings</p>
      </div>

      <Tabs value={selectedYear} onValueChange={setSelectedYear}>
        <TabsList className="border-2 border-border">
          {fiscalYears.map(fy => (
            <TabsTrigger key={fy.id} value={fy.id}>{fy.year_label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedYear} className="mt-4">
          <DataTable
            data={extensions}
            columns={columns}
            searchPlaceholder="Search extensions..."
            searchKey="client_id"
            title="Extensions"
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex gap-2">
                {row.extension_status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(row)}>
                      <CheckCircle className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(row)}>
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </>
                )}
                {row.extension_status !== 'pending' && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {row.extension_status}
                  </span>
                )}
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
