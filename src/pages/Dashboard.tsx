import { Users, Briefcase, Calendar, CreditCard, Plus, FileText, Receipt, Clock, TrendingUp, ArrowRight, Brain, Sparkles } from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useAppointments } from '@/hooks/useAppointments';
import { usePayments } from '@/hooks/usePayments';
import { AIAnalytics } from '@/components/dashboard/AIAnalytics';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ExpenseBreakdownChart } from '@/components/dashboard/ExpenseBreakdownChart';
import { FinancialSummaryCards } from '@/components/dashboard/FinancialSummaryCards';
import { UnassignedCounters } from '@/components/dashboard/UnassignedCounters';
import { useState } from 'react';

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const { data: appointments = [] } = useAppointments();
  const { data: payments = [] } = usePayments();

  const totalClients = clients.length;
  const activeCases = cases.filter((c) => c.status !== 'closed' && c.status !== 'archived').length;
  const scheduledAppointments = appointments.filter((a) => a.status === 'scheduled').length;
  const pendingPayments = payments.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  const recentCases = cases.slice(0, 5);
  const upcomingAppointments = appointments.filter((a) => a.status === 'scheduled').slice(0, 3);

  const quickActions = [
    { label: 'Add Client', icon: Plus, variant: 'default' as const, path: '/clients', color: 'primary' },
    { label: 'New Case', icon: Briefcase, variant: 'default' as const, path: '/cases', color: 'success' },
    { label: 'Upload Document', icon: FileText, variant: 'outline' as const, path: '/documents', color: 'info' },
    { label: 'Create Invoice', icon: Receipt, variant: 'outline' as const, path: '/invoices', color: 'warning' },
    { label: 'Schedule Appointment', icon: Calendar, variant: 'outline' as const, path: '/appointments', color: 'purple' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-medium text-foreground">{profile?.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button 
                variant={showAssistant ? "default" : "outline"}
                className="gap-2 text-xs sm:text-sm"
                size="sm"
                onClick={() => { setShowAssistant(!showAssistant); setShowAnalytics(false); }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">{showAssistant ? 'Hide Assistant' : 'AI Assistant'}</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button 
                variant={showAnalytics ? "default" : "outline"}
                className="gap-2 text-xs sm:text-sm"
                size="sm"
                onClick={() => { setShowAnalytics(!showAnalytics); setShowAssistant(false); }}
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">{showAnalytics ? 'Hide Analytics' : 'AI Analytics'}</span>
                <span className="sm:hidden">Analytics</span>
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            className="gap-2 text-xs sm:text-sm"
            size="sm"
            onClick={() => navigate('/clients')}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">View Reports</span>
            <span className="sm:hidden">Reports</span>
          </Button>
        </div>
      </div>

      {/* Unassigned Items Alert */}
      {isAdmin && <UnassignedCounters />}

      {/* Financial Summary Cards - Admin Only */}
      {isAdmin && <FinancialSummaryCards />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={isAdmin ? 'Total Clients' : 'My Clients'}
          value={totalClients}
          icon={Users}
          trend={{ value: 12, label: 'from last month' }}
          variant="primary"
        />
        <KpiCard
          title={isAdmin ? 'Active Cases' : 'My Cases'}
          value={activeCases}
          icon={Briefcase}
          trend={{ value: 8, label: 'from last month' }}
          variant="success"
        />
        <KpiCard
          title="Appointments"
          value={scheduledAppointments}
          icon={Calendar}
          variant="info"
        />
        <KpiCard
          title="Pending Payments"
          value={`PKR ${pendingPayments.toLocaleString()}`}
          icon={CreditCard}
          trend={{ value: -5, label: 'from last week' }}
          variant="warning"
        />
      </div>

      {/* AI Analytics Section */}
      {showAnalytics && <AIAnalytics />}
      
      {/* AI Assistant Section */}
      {showAssistant && <AIAssistant />}

      {/* Quick Actions */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-card to-muted/30 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-card/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {quickActions.map((action) => (
              <Button 
                key={action.label}
                variant={action.variant}
                size="sm"
                className={`gap-2 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm ${
                  action.variant === 'default' 
                    ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
                Recent Cases
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate('/cases')}>
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentCases.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No cases found. Create your first case to get started.
                </div>
              ) : (
                recentCases.map((caseItem, idx) => (
                  <div
                    key={caseItem.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => navigate('/cases')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{caseItem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.id.slice(0, 8)}...
                        </p>
                      </div>
                      <StatusBadge status={caseItem.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                Upcoming
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate('/appointments')}>
                All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {upcomingAppointments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No upcoming appointments
                </div>
              ) : (
                upcomingAppointments.map((apt, idx) => (
                  <div 
                    key={apt.id} 
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-xl">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{apt.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.date), 'MMM d')} at {apt.time}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.client_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown & Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Chart */}
        {isAdmin && <ExpenseBreakdownChart />}

        {/* Activity Summary Card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full" />
              {isAdmin ? 'System Overview' : 'My Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-primary">{totalClients}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Clients</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{activeCases}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Cases</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 text-center">
                <p className="text-xl sm:text-2xl font-bold text-amber-600">{scheduledAppointments}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Scheduled</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/5 text-center">
                <p className="text-lg sm:text-2xl font-bold text-rose-600 break-all">PKR {pendingPayments.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
