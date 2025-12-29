import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { useITRFiscalYears, useITRDashboardStats, useCreateFiscalYear } from '@/hooks/useITRPortal';
import { KpiCard } from '@/components/ui/kpi-card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PROGRESS_COLORS = {
  pending: '#94a3b8',
  bank_statement_compiled: '#f59e0b',
  drafted: '#3b82f6',
  discussion: '#8b5cf6',
  filed: '#22c55e',
};

export default function ITRDashboard() {
  const { data: fiscalYears = [] } = useITRFiscalYears();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYear, setNewYear] = useState({ label: '', start: '', end: '' });
  const createYear = useCreateFiscalYear();

  const fiscalYearId = selectedYear === 'all' ? undefined : selectedYear;
  const { data: stats } = useITRDashboardStats(fiscalYearId);

  const progressData = stats ? [
    { name: 'Pending', value: stats.progressDistribution.pending, color: PROGRESS_COLORS.pending },
    { name: 'Bank Compiled', value: stats.progressDistribution.bank_statement_compiled, color: PROGRESS_COLORS.bank_statement_compiled },
    { name: 'Drafted', value: stats.progressDistribution.drafted, color: PROGRESS_COLORS.drafted },
    { name: 'Discussion', value: stats.progressDistribution.discussion, color: PROGRESS_COLORS.discussion },
    { name: 'Filed', value: stats.progressDistribution.filed, color: PROGRESS_COLORS.filed },
  ].filter(d => d.value > 0) : [];

  const paymentData = stats ? [
    { name: 'Paid', value: stats.paid },
    { name: 'Unpaid', value: stats.unpaid },
  ] : [];

  const handleCreateYear = async () => {
    if (!newYear.label || !newYear.start || !newYear.end) return;
    await createYear.mutateAsync({
      year_label: newYear.label,
      start_date: newYear.start,
      end_date: newYear.end,
    });
    setShowNewYear(false);
    setNewYear({ label: '', start: '', end: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">ITR Dashboard</h1>
          <p className="text-muted-foreground">Income Tax Return filing overview</p>
        </div>
        <Button onClick={() => setShowNewYear(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Fiscal Year
        </Button>
      </div>

      {/* Year Filter */}
      <Tabs value={selectedYear} onValueChange={setSelectedYear}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All Time</TabsTrigger>
          {fiscalYears.map(fy => (
            <TabsTrigger key={fy.id} value={fy.id}>{fy.year_label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedYear} className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Clients"
              value={stats?.totalClients || 0}
              icon={Users}
              trend={{ value: 0, isPositive: true }}
            />
            <KpiCard
              title="Filed"
              value={stats?.filed || 0}
              icon={CheckCircle}
              trend={{ value: stats?.totalClients ? Math.round((stats.filed / stats.totalClients) * 100) : 0, isPositive: true }}
            />
            <KpiCard
              title="In Progress"
              value={stats?.inProgress || 0}
              icon={Clock}
            />
            <KpiCard
              title="Extensions"
              value={stats?.extensions || 0}
              icon={AlertTriangle}
            />
          </div>

          {/* Revenue Card */}
          <Card className="border-2 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">PKR {(stats?.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">{stats?.paid || 0}</p>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-500">{stats?.unpaid || 0}</p>
                  <p className="text-sm text-muted-foreground">Unpaid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Progress Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Year Dialog */}
      <Dialog open={showNewYear} onOpenChange={setShowNewYear}>
        <DialogContent className="border-2 border-border">
          <DialogHeader>
            <DialogTitle>Create New Fiscal Year</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Year Label (e.g., FY26)</Label>
              <Input
                placeholder="FY26"
                value={newYear.label}
                onChange={(e) => setNewYear({ ...newYear, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newYear.start}
                  onChange={(e) => setNewYear({ ...newYear, start: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newYear.end}
                  onChange={(e) => setNewYear({ ...newYear, end: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewYear(false)}>Cancel</Button>
            <Button onClick={handleCreateYear} disabled={createYear.isPending}>
              {createYear.isPending ? 'Creating...' : 'Create Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
