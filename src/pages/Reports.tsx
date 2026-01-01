import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useExpenses } from '@/hooks/useExpenses';
import { FileText, TrendingUp, Users, Briefcase, CreditCard, Wallet, Download, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, TrendingDown } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DATE_PRESETS, useReportsFilters, type DateRangePreset } from '@/hooks/useReportsFilters';
import { cn } from '@/lib/utils';

const COLORS = ['#006A4E', '#00857C', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: cases = [], isLoading: loadingCases } = useCases();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const {
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    dateRange,
    filterByDate,
  } = useReportsFilters();

  const isLoading = loadingClients || loadingCases || loadingPayments || loadingInvoices || loadingExpenses;

  // Filtered data based on date range
  const filteredClients = filterByDate(clients);
  const filteredCases = filterByDate(cases);
  const filteredPayments = filterByDate(payments, 'payment_date');
  const filteredInvoices = filterByDate(invoices);
  const filteredExpenses = filterByDate(expenses, 'date');

  // Calculate monthly data for charts (last 12 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
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

      const newClients = clients.filter(c => 
        isWithinInterval(new Date(c.created_at), { start, end })
      ).length;

      const newCases = cases.filter(c => 
        isWithinInterval(new Date(c.created_at), { start, end })
      ).length;

      const invoiceCount = invoices.filter(i => 
        isWithinInterval(new Date(i.created_at), { start, end })
      ).length;

      const paidInvoices = invoices.filter(i => 
        i.status === 'paid' && isWithinInterval(new Date(i.created_at), { start, end })
      ).length;

      return {
        month: format(date, 'MMM'),
        fullMonth: format(date, 'MMM yyyy'),
        revenue,
        expense,
        profit: revenue - expense,
        newClients,
        newCases,
        invoiceCount,
        paidInvoices,
        collectionRate: invoiceCount > 0 ? (paidInvoices / invoiceCount) * 100 : 0,
      };
    });
  }, [payments, expenses, clients, cases, invoices]);

  // Summary stats for filtered data
  const stats = useMemo(() => {
    const totalRevenue = filteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = filteredExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
    const unpaidInvoices = filteredInvoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + Number(i.amount), 0);
    const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0);
    
    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      totalInvoiced,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      collectionRate: totalInvoiced > 0 ? (paidInvoices / totalInvoiced) * 100 : 0,
      activeCases: filteredCases.filter(c => c.status === 'active').length,
      pendingCases: filteredCases.filter(c => c.status === 'pending').length,
      closedCases: filteredCases.filter(c => c.status === 'closed').length,
      totalClients: filteredClients.length,
      activeClients: filteredClients.filter(c => c.status === 'active').length,
      individualClients: filteredClients.filter(c => c.client_type === 'individual').length,
      corporateClients: filteredClients.filter(c => c.client_type === 'corporate').length,
    };
  }, [filteredPayments, filteredExpenses, filteredInvoices, filteredCases, filteredClients]);

  // Comparison data (current vs previous period)
  const comparison = useMemo(() => {
    if (!dateRange) return null;

    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const prevStart = new Date(dateRange.start.getTime() - periodLength);
    const prevEnd = new Date(dateRange.end.getTime() - periodLength);

    const prevPayments = payments.filter(p => {
      if (!p.payment_date) return false;
      const date = new Date(p.payment_date);
      return isWithinInterval(date, { start: prevStart, end: prevEnd });
    });

    const prevRevenue = prevPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
    const currentRevenue = stats.totalRevenue;

    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const prevCases = cases.filter(c => {
      const date = new Date(c.created_at);
      return isWithinInterval(date, { start: prevStart, end: prevEnd });
    }).length;

    const currentCases = filteredCases.length;
    const casesChange = prevCases > 0 ? ((currentCases - prevCases) / prevCases) * 100 : 0;

    return { revenueChange, casesChange, prevRevenue, prevCases };
  }, [dateRange, payments, cases, filteredCases, stats.totalRevenue]);

  // Chart data
  const caseStatusData = [
    { name: 'Active', value: stats.activeCases },
    { name: 'Pending', value: stats.pendingCases },
    { name: 'Closed', value: stats.closedCases },
  ].filter(d => d.value > 0);

  const clientTypeData = [
    { name: 'Individual', value: stats.individualClients },
    { name: 'Corporate', value: stats.corporateClients },
  ].filter(d => d.value > 0);

  const invoiceStatusData = [
    { name: 'Paid', value: filteredInvoices.filter(i => i.status === 'paid').length },
    { name: 'Unpaid', value: filteredInvoices.filter(i => i.status === 'unpaid').length },
    { name: 'Overdue', value: filteredInvoices.filter(i => i.status === 'overdue').length },
  ].filter(d => d.value > 0);

  const paymentStatusData = [
    { name: 'Completed', value: filteredPayments.filter(p => p.status === 'completed').length },
    { name: 'Pending', value: filteredPayments.filter(p => p.status === 'pending').length },
  ].filter(d => d.value > 0);

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
          {/* Date Range Filter */}
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DateRangePreset)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {datePreset === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-[130px] justify-start", !customStartDate && "text-muted-foreground")}>
                    {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-[130px] justify-start", !customEndDate && "text-muted-foreground")}>
                    {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
            {comparison && comparison.revenueChange !== 0 && (
              <p className={cn("text-xs flex items-center gap-1 mt-1", comparison.revenueChange > 0 ? "text-green-600" : "text-red-600")}>
                {comparison.revenueChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(comparison.revenueChange).toFixed(1)}% vs previous period
              </p>
            )}
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
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Profit: <span className={stats.profit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(stats.profit)}</span>
            </p>
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
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.unpaidInvoices + stats.overdueInvoices)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Collection rate: <span className="font-medium">{stats.collectionRate.toFixed(1)}%</span>
            </p>
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
            <p className="text-2xl font-bold">{stats.activeCases}</p>
            {comparison && comparison.casesChange !== 0 && (
              <p className={cn("text-xs flex items-center gap-1 mt-1", comparison.casesChange > 0 ? "text-green-600" : "text-red-600")}>
                {comparison.casesChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(comparison.casesChange).toFixed(1)}% vs previous period
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Clients</p>
            <p className="text-xl font-bold">{stats.totalClients}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Clients</p>
            <p className="text-xl font-bold text-green-600">{stats.activeClients}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Cases</p>
            <p className="text-xl font-bold">{filteredCases.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Cases</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pendingCases}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Payments</p>
            <p className="text-xl font-bold">{filteredPayments.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-xl font-bold">{filteredInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="border-2 border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue vs Expenses (12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
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
                <CardTitle>Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#006A4E" fill="#006A4E" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Collection Rate Trend</CardTitle>
                <CardDescription>Invoice collection rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="collectionRate" name="Collection Rate" stroke="#006A4E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Invoice Status Distribution</CardTitle>
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

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Total Invoiced</span>
                  <span className="text-xl font-bold">{formatCurrency(stats.totalInvoiced)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Paid</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(stats.paidInvoices)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <span>Unpaid</span>
                  <span className="text-xl font-bold text-yellow-600">{formatCurrency(stats.unpaidInvoices)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span>Overdue</span>
                  <span className="text-xl font-bold text-red-600">{formatCurrency(stats.overdueInvoices)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Invoice Count Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="invoiceCount" name="Total Invoices" fill="#006A4E" />
                    <Bar dataKey="paidInvoices" name="Paid Invoices" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {paymentStatusData.map((_, index) => (
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
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Total Payments</span>
                  <span className="text-2xl font-bold">{filteredPayments.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Completed Payments</span>
                  <span className="text-2xl font-bold text-green-600">{filteredPayments.filter(p => p.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <span>Pending Payments</span>
                  <span className="text-2xl font-bold text-yellow-600">{filteredPayments.filter(p => p.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Total Amount</span>
                  <span className="text-xl font-bold">{formatCurrency(filteredPayments.reduce((s, p) => s + Number(p.amount), 0))}</span>
                </div>
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
                  <span className="text-2xl font-bold">{filteredCases.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Active Cases</span>
                  <span className="text-2xl font-bold text-green-600">{stats.activeCases}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                  <span>Pending Cases</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats.pendingCases}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span>Closed Cases</span>
                  <span className="text-2xl font-bold">{stats.closedCases}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>New Cases Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newCases" name="New Cases" stroke="#006A4E" fill="#006A4E" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
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
                  <span className="text-2xl font-bold">{stats.totalClients}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span>Active Clients</span>
                  <span className="text-2xl font-bold text-green-600">{stats.activeClients}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span>Individual Clients</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.individualClients}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span>Corporate Clients</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.corporateClients}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>New Clients Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newClients" name="New Clients" stroke="#006A4E" fill="#006A4E" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
