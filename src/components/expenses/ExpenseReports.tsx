import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseData } from '@/hooks/useExpenses';
import { format, startOfMonth, subMonths, parseISO } from 'date-fns';

interface ExpenseReportsProps {
  expenses: ExpenseData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  office_supplies: 'hsl(var(--chart-1))',
  travel: 'hsl(var(--chart-2))',
  utilities: 'hsl(var(--chart-3))',
  software: 'hsl(var(--chart-4))',
  legal_fees: 'hsl(var(--chart-5))',
  marketing: 'hsl(var(--primary))',
  equipment: 'hsl(var(--secondary))',
  meals: 'hsl(var(--accent))',
  professional_services: 'hsl(var(--muted))',
  other: 'hsl(var(--border))',
};

const CATEGORY_LABELS: Record<string, string> = {
  office_supplies: 'Office Supplies',
  travel: 'Travel',
  utilities: 'Utilities',
  software: 'Software',
  legal_fees: 'Legal Fees',
  marketing: 'Marketing',
  equipment: 'Equipment',
  meals: 'Meals',
  professional_services: 'Professional Services',
  other: 'Other',
};

export function ExpenseReports({ expenses }: ExpenseReportsProps) {
  // Monthly spending data for the last 12 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; total: number; approved: number; pending: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthKey = format(monthStart, 'yyyy-MM');
      const monthLabel = format(monthStart, 'MMM yyyy');

      const monthExpenses = expenses.filter(e => {
        const expenseDate = parseISO(e.date);
        return format(expenseDate, 'yyyy-MM') === monthKey;
      });

      months.push({
        month: monthLabel,
        total: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
        approved: monthExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0),
        pending: monthExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0),
      });
    }

    return months;
  }, [expenses]);

  // Spending by category
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};

    expenses.forEach(e => {
      const cat = e.category || 'other';
      categories[cat] = (categories[cat] || 0) + Number(e.amount);
    });

    return Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        label: CATEGORY_LABELS[category] || category,
        amount,
        fill: CATEGORY_COLORS[category] || 'hsl(var(--muted))',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Monthly trend by category
  const trendData = useMemo(() => {
    const now = new Date();
    const months: Record<string, string | number>[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthKey = format(monthStart, 'yyyy-MM');
      const monthLabel = format(monthStart, 'MMM');

      const monthExpenses = expenses.filter(e => {
        const expenseDate = parseISO(e.date);
        return format(expenseDate, 'yyyy-MM') === monthKey;
      });

      const categoryTotals: Record<string, string | number> = { month: monthLabel };
      monthExpenses.forEach(e => {
        const cat = e.category || 'other';
        categoryTotals[cat] = ((categoryTotals[cat] as number) || 0) + Number(e.amount);
      });

      months.push(categoryTotals);
    }

    return months;
  }, [expenses]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach(e => cats.add(e.category || 'other'));
    return Array.from(cats);
  }, [expenses]);

  const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgMonthlySpending = totalSpending / 12;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Total Spending (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSpending.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Avg ${avgMonthlySpending.toLocaleString()} / month</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData[0] && (
              <>
                <p className="text-3xl font-bold">{categoryData[0].label}</p>
                <p className="text-sm text-muted-foreground">${categoryData[0].amount.toLocaleString()}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="border-2 border-border">
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="breakdown">Category Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Total, approved, and pending expenses over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approved" name="Approved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Distribution of expenses across categories</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="amount"
                    nameKey="label"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {categoryData.map(cat => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                    <span>{cat.label}: ${cat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Category Trend Over Time</CardTitle>
              <CardDescription>How spending by category changes month to month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => `$${value?.toLocaleString() || 0}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {uniqueCategories.map(cat => (
                    <Line
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      name={CATEGORY_LABELS[cat] || cat}
                      stroke={CATEGORY_COLORS[cat] || 'hsl(var(--muted))'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
