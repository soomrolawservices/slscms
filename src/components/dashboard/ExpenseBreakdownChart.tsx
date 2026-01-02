import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useExpenses } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChartIcon } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // green
  'hsl(217, 91%, 60%)', // blue
  'hsl(38, 92%, 50%)', // amber
  'hsl(280, 87%, 65%)', // purple
  'hsl(349, 89%, 60%)', // rose
  'hsl(173, 80%, 40%)', // teal
  'hsl(27, 96%, 61%)', // orange
];

export function ExpenseBreakdownChart() {
  const { data: expenses = [], isLoading } = useExpenses();

  // Group approved expenses by category/type
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  
  const expensesByCategory = approvedExpenses.reduce((acc: Record<string, number>, expense) => {
    const category = expense.category || expense.expense_type || 'General';
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    .sort((a, b) => b.value - a.value);

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="pt-5">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <PieChartIcon className="h-12 w-12 mb-3 opacity-40" />
            <p>No approved expenses yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
            Operating Expenses
          </CardTitle>
          <span className="text-sm font-bold text-muted-foreground">
            Total: PKR {totalExpenses.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Amount']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs capitalize">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Category breakdown list */}
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="capitalize">{item.name}</span>
              </div>
              <span className="font-medium">PKR {item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
