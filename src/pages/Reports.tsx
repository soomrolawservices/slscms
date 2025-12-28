import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useExpenses } from '@/hooks/useExpenses';
import { FileText, TrendingUp, Users, Briefcase, CreditCard, Wallet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#006A4E', '#00857C', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: cases = [], isLoading: loadingCases } = useCases();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const isLoading = loadingClients || loadingCases || loadingPayments || loadingInvoices || loadingExpenses;

  // Calculate monthly revenue (last 6 months)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const revenue = payments
      .filter(p => p.status === 'completed' && p.payment_date && 
        isWithinInterval(new Date(p.payment_date), { start, end }))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const expense = expenses
      .filter(e => e.status === 'approved' && 
        isWithinInterval(new Date(e.date), { start, end }))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      month: format(date, 'MMM'),
      revenue,
      expense,
      profit: revenue - expense,
    };
  });

  // Case status distribution
  const caseStatusData = [
    { name: 'Active', value: cases.filter(c => c.status === 'active').length },
    { name: 'Pending', value: cases.filter(c => c.status === 'pending').length },
    { name: 'Closed', value: cases.filter(c => c.status === 'closed').length },
  ].filter(d => d.value > 0);

  // Client type distribution
  const clientTypeData = [
    { name: 'Individual', value: clients.filter(c => c.client_type === 'individual').length },
    { name: 'Corporate', value: clients.filter(c => c.client_type === 'corporate').length },
  ].filter(d => d.value > 0);

  // Invoice status
  const invoiceStatusData = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length },
    { name: 'Unpaid', value: invoices.filter(i => i.status === 'unpaid').length },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length },
  ].filter(d => d.value > 0);

  // Summary stats
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + Number(i.amount), 0);
  const activeCases = cases.filter(c => c.status === 'active').length;

  const formatCurrency = (value: number) => `PKR ${value.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingInvoices)}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Active Cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCases}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="border-2 border-border">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue vs Expenses
                </CardTitle>
                <CardDescription>Last 6 months comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#006A4E" />
                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Payment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {invoiceStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Profit Trend</CardTitle>
                <CardDescription>Monthly profit over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#006A4E" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Case Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {caseStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Total Cases</span>
                  <span className="text-2xl font-bold">{cases.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Active Cases</span>
                  <span className="text-2xl font-bold text-green-600">{cases.filter(c => c.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <span>Pending Cases</span>
                  <span className="text-2xl font-bold text-yellow-600">{cases.filter(c => c.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Closed Cases</span>
                  <span className="text-2xl font-bold">{cases.filter(c => c.status === 'closed').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {clientTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Client Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Total Clients</span>
                  <span className="text-2xl font-bold">{clients.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Active Clients</span>
                  <span className="text-2xl font-bold text-green-600">{clients.filter(c => c.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span>Individual Clients</span>
                  <span className="text-2xl font-bold text-blue-600">{clients.filter(c => c.client_type === 'individual').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span>Corporate Clients</span>
                  <span className="text-2xl font-bold text-purple-600">{clients.filter(c => c.client_type === 'corporate').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
