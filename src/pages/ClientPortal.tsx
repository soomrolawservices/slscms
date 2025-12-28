import { Briefcase, FileText, CreditCard, Receipt, Home, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientPortalData } from '@/hooks/useClientPortal';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientPortal() {
  const { profile, userRole } = useAuth();
  const { client, cases, documents, payments, invoices, isLoading, hasAccess } = useClientPortalData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Access</h2>
        <p className="text-muted-foreground max-w-md">
          Your account is not linked to any client record. Please contact your case manager for assistance.
        </p>
      </div>
    );
  }

  const caseColumns: Column<typeof cases[0]>[] = [
    {
      key: 'title',
      header: 'Case Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Opened',
      sortable: true,
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  const documentColumns: Column<typeof documents[0]>[] = [
    {
      key: 'title',
      header: 'Document',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'document_type',
      header: 'Type',
      render: (row) => row.document_type || '-',
    },
    {
      key: 'created_at',
      header: 'Uploaded',
      sortable: true,
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  const paymentColumns: Column<typeof payments[0]>[] = [
    {
      key: 'title',
      header: 'Description',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-bold">${Number(row.amount).toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
      render: (row) => row.payment_date ? format(new Date(row.payment_date), 'MMM d, yyyy') : '-',
    },
  ];

  const invoiceColumns: Column<typeof invoices[0]>[] = [
    {
      key: 'invoice_id',
      header: 'Invoice #',
      sortable: true,
      render: (row) => <span className="font-medium">{row.invoice_id}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-bold">${Number(row.amount).toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row) => row.due_date ? format(new Date(row.due_date), 'MMM d, yyyy') : '-',
    },
  ];

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {profile?.name || client?.name}</h1>
          <p className="text-muted-foreground">View your cases, documents, and financial information</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Active Cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cases.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Pending Invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">${pendingInvoices.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="border-2 border-border">
          <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-4">
          <DataTable
            data={cases}
            columns={caseColumns}
            searchPlaceholder="Search cases..."
            searchKey="title"
            title="Your Cases"
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DataTable
            data={documents}
            columns={documentColumns}
            searchPlaceholder="Search documents..."
            searchKey="title"
            title="Your Documents"
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <DataTable
            data={payments}
            columns={paymentColumns}
            searchPlaceholder="Search payments..."
            searchKey="title"
            title="Your Payments"
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <DataTable
            data={invoices}
            columns={invoiceColumns}
            searchPlaceholder="Search invoices..."
            searchKey="invoice_id"
            title="Your Invoices"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
