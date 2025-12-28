import { Briefcase, FileText, CreditCard, Receipt, User, Clock, AlertCircle, Calendar, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientPortalData } from '@/hooks/useClientPortal';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientAppointmentBooking } from '@/components/portal/ClientAppointmentBooking';
import { useNavigate } from 'react-router-dom';

export default function ClientPortal() {
  const { profile, userRole, logout } = useAuth();
  const { client, cases, documents, payments, invoices, isLoading, hasAccess } = useClientPortalData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/client-login');
  };

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

  // Check user status for approval workflow
  const isPending = profile?.status === 'pending';
  const isBlocked = profile?.status === 'blocked';

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Clock className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
        <p className="text-muted-foreground max-w-md">
          Your account is pending approval. You will be notified once your access has been approved by an administrator.
        </p>
        <Button variant="outline" onClick={handleLogout} className="mt-6">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          Your account has been blocked. Please contact support for assistance.
        </p>
        <Button variant="outline" onClick={handleLogout} className="mt-6">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
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
        <Button variant="outline" onClick={handleLogout} className="mt-6">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
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
      render: (row) => <span className="font-bold">PKR {Number(row.amount).toLocaleString()}</span>,
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
      render: (row) => <span className="font-bold">PKR {Number(row.amount).toLocaleString()}</span>,
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

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center shadow">
              <span className="text-sm font-bold text-white">SL</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Soomro Law Services</p>
              <p className="text-xs text-muted-foreground italic">Just Relax! You are in Safe Hands.</p>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {profile?.name || client?.name}</h1>
          <p className="text-muted-foreground">View your cases, documents, and financial information</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
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
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
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
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingInvoices)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="border-2 border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
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

        <TabsContent value="appointments" className="mt-4">
          <ClientAppointmentBooking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
