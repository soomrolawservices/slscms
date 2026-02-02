import { TrendingUp, TrendingDown, DollarSign, FileText, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useExpenses } from '@/hooks/useExpenses';
import { useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export function FinancialSummaryCards() {
  const { data: payments = [] } = usePayments();
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [] } = useExpenses();

  const financialMetrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // Total revenue (all time)
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Current month revenue
    const currentMonthRevenue = payments
      .filter(p => p.status === 'completed' && p.payment_date && 
        isWithinInterval(new Date(p.payment_date), { start: currentMonthStart, end: currentMonthEnd }))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Previous month revenue
    const prevMonthRevenue = payments
      .filter(p => p.status === 'completed' && p.payment_date && 
        isWithinInterval(new Date(p.payment_date), { start: prevMonthStart, end: prevMonthEnd }))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Monthly change percentage
    const monthlyChange = prevMonthRevenue > 0 
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    // Outstanding invoices (unpaid + overdue)
    const outstandingInvoices = invoices
      .filter(i => i.status === 'unpaid' || i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const overdueCount = invoices.filter(i => i.status === 'overdue').length;

    // Total expenses
    const totalExpenses = expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Profit margin
    const profitMargin = totalRevenue > 0 
      ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      currentMonthRevenue,
      monthlyChange,
      outstandingInvoices,
      overdueCount,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      profitMargin,
    };
  }, [payments, invoices, expenses]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `PKR ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `PKR ${(value / 1000).toFixed(0)}K`;
    }
    return `PKR ${value.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(financialMetrics.totalRevenue)}</p>
          <p className="text-xs opacity-80 mt-1">All time completed payments</p>
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            {financialMetrics.monthlyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(financialMetrics.currentMonthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {financialMetrics.monthlyChange >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-300" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-300" />
            )}
            <span className={`text-xs font-semibold ${financialMetrics.monthlyChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {Math.abs(financialMetrics.monthlyChange).toFixed(1)}%
            </span>
            <span className="text-xs opacity-70">vs last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(financialMetrics.outstandingInvoices)}</p>
          <p className="text-xs opacity-80 mt-1">
            {financialMetrics.overdueCount > 0 
              ? `${financialMetrics.overdueCount} overdue invoice${financialMetrics.overdueCount > 1 ? 's' : ''}`
              : 'No overdue invoices'
            }
          </p>
        </CardContent>
      </Card>

      {/* Profit Margin */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Profit Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl lg:text-3xl font-bold">{financialMetrics.profitMargin.toFixed(1)}%</p>
          <p className="text-xs opacity-80 mt-1">
            Net: {formatCurrency(financialMetrics.netProfit)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
