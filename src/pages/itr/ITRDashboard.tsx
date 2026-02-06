import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Target, Zap, Calendar, BarChart2 } from 'lucide-react';
import { useITRFiscalYears, useITRDashboardStats, useCreateFiscalYear, useITRPortalEnabled } from '@/hooks/useITRPortal';
import { KpiCard } from '@/components/ui/kpi-card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Navigate } from 'react-router-dom';

const PROGRESS_COLORS = {
  pending: '#94a3b8',
  bank_statement_compiled: '#f59e0b',
  drafted: '#3b82f6',
  discussion: '#8b5cf6',
  filed: '#22c55e',
};

export default function ITRDashboard() {
  const { data: fiscalYears = [] } = useITRFiscalYears();
  const { data: itrEnabled, isLoading: itrLoading } = useITRPortalEnabled();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYear, setNewYear] = useState({ label: '', start: '', end: '' });
  const createYear = useCreateFiscalYear();

  const fiscalYearId = selectedYear === 'all' ? undefined : selectedYear;
  const { data: stats } = useITRDashboardStats(fiscalYearId);

  // Get selected fiscal year details for deadline calculations
  const selectedFiscalYear = fiscalYears.find(fy => fy.id === selectedYear);

  // Redirect if ITR Portal is disabled (after hooks)
  if (!itrLoading && itrEnabled === false) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Calculate deadline stats
  const calculateDeadlineStats = () => {
    if (!selectedFiscalYear || !stats) return null;

    const today = new Date();
    const startDate = parseISO(selectedFiscalYear.start_date);
    const endDate = parseISO(selectedFiscalYear.end_date);
    
    const totalDays = differenceInDays(endDate, startDate);
    const daysSpent = Math.max(0, differenceInDays(today, startDate));
    const daysLeft = Math.max(0, differenceInDays(endDate, today));
    
    const totalReturns = stats.totalClients;
    const filedReturns = stats.filed;
    const remainingReturns = totalReturns - filedReturns;
    
    // Speed calculations
    const currentSpeed = daysSpent > 0 ? (filedReturns / daysSpent) : 0;
    const requiredSpeed = daysLeft > 0 ? (remainingReturns / daysLeft) : 0;
    
    // Expected filing at current speed
    const expectedFiledByDeadline = Math.min(
      totalReturns,
      filedReturns + Math.floor(currentSpeed * daysLeft)
    );
    
    // Probability of meeting deadline (simple calculation)
    let probability = 100;
    if (remainingReturns > 0 && daysLeft > 0) {
      probability = Math.min(100, Math.round((currentSpeed / requiredSpeed) * 100));
    } else if (remainingReturns > 0 && daysLeft === 0) {
      probability = 0;
    }
    
    return {
      deadline: format(endDate, 'MMM d, yyyy'),
      totalDays,
      daysSpent,
      daysLeft,
      currentSpeed: currentSpeed.toFixed(2),
      requiredSpeed: requiredSpeed.toFixed(2),
      expectedFiling: expectedFiledByDeadline,
      probability,
      filedReturns,
      totalReturns,
      remainingReturns
    };
  };

  const deadlineStats = calculateDeadlineStats();

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
        <TabsList className="border-2 border-border flex-wrap h-auto">
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
            />
            <KpiCard
              title="Filed"
              value={stats?.filed || 0}
              icon={CheckCircle}
              trend={{ value: stats?.totalClients ? Math.round((stats.filed / stats.totalClients) * 100) : 0, label: 'completion' }}
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

          {/* Deadline Stats - Only show when specific year is selected */}
          {deadlineStats && selectedYear !== 'all' && (
            <Card className="border-2 border-border bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Deadline Tracking - {selectedFiscalYear?.year_label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{deadlineStats.deadline}</p>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold">{deadlineStats.daysLeft}</p>
                    <p className="text-xs text-muted-foreground">Days Left</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <BarChart2 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{deadlineStats.daysSpent}</p>
                    <p className="text-xs text-muted-foreground">Days Spent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{deadlineStats.currentSpeed}</p>
                    <p className="text-xs text-muted-foreground">Returns/Day</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">{deadlineStats.requiredSpeed}</p>
                    <p className="text-xs text-muted-foreground">Required Speed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background border border-border">
                    <Target className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <p className="text-lg font-bold">{deadlineStats.expectedFiling}/{deadlineStats.totalReturns}</p>
                    <p className="text-xs text-muted-foreground">Expected Filing</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Filing Progress: {deadlineStats.filedReturns}/{deadlineStats.totalReturns}</span>
                    <span className={deadlineStats.probability >= 70 ? 'text-green-500' : deadlineStats.probability >= 40 ? 'text-amber-500' : 'text-red-500'}>
                      {deadlineStats.probability}% chance of meeting deadline
                    </span>
                  </div>
                  <Progress 
                    value={(deadlineStats.filedReturns / Math.max(1, deadlineStats.totalReturns)) * 100} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Time elapsed: {Math.round((deadlineStats.daysSpent / Math.max(1, deadlineStats.totalDays)) * 100)}%</span>
                    <span>{deadlineStats.remainingReturns} returns remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <p className="text-2xl md:text-3xl font-bold text-primary">PKR {(stats?.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-green-500">{stats?.paid || 0}</p>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-amber-500">{stats?.unpaid || 0}</p>
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
            <DialogDescription>
              Define the fiscal year period for ITR filings. The start and end dates will be used to calculate deadline tracking metrics.
            </DialogDescription>
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
                <p className="text-xs text-muted-foreground">Filing period start</p>
              </div>
              <div className="grid gap-2">
                <Label>End Date (Deadline)</Label>
                <Input
                  type="date"
                  value={newYear.end}
                  onChange={(e) => setNewYear({ ...newYear, end: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Filing deadline</p>
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
