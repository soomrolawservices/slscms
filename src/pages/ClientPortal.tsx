import { Briefcase, FileText, CreditCard, Receipt, User, Clock, AlertCircle, Calendar, LogOut, MessageSquare, Download } from 'lucide-react';
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
import { ClientMessaging } from '@/components/portal/ClientMessaging';
import { ClientCaseTimeline } from '@/components/cases/ClientCaseTimeline';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const handleDownloadDocument = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: 'Error downloading document', description: error.message, variant: 'destructive' });
    }
  };

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
    {
      key: 'actions',
      header: 'Action',
      render: (row) => row.file_path ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleDownloadDocument(row.file_path!, row.title)}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      ) : null,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center shadow">
              <span className="text-xs sm:text-sm font-bold text-white">SL</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Soomro Law Services</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground italic hidden sm:block">Just Relax! You are in Safe Hands.</p>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {profile?.name || client?.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View your cases, documents, and financial information</p>
        </div>
        <Button variant="outline" onClick={handleLogout} size="sm" className="w-fit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Summary Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border border-border">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Active Cases</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{cases.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Documents</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Total Paid</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Pending</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">{formatCurrency(pendingInvoices)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <Tabs defaultValue="cases" className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="border border-border inline-flex w-max sm:w-full h-auto gap-0.5 p-0.5 sm:p-1">
            <TabsTrigger value="cases" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Cases</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Docs</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Payments</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Invoices</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Appointments</span>
              <span className="sm:hidden">Appts</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 flex items-center gap-1">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Msgs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Your Cases & Activity Timeline
              </CardTitle>
              <CardDescription>
                Click on a case to view its detailed activity history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientCaseTimeline cases={cases} />
            </CardContent>
          </Card>
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

        <TabsContent value="messages" className="mt-4">
          <ClientMessaging />
        </TabsContent>
      </Tabs>
    </div>
  );
}
