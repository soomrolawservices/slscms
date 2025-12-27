import { Users, Briefcase, Calendar, CreditCard, Plus, FileText, Receipt, Clock } from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { mockClients, mockCases, mockAppointments, mockPayments, mockActivityLogs, getClientById } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { format, formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  const totalClients = mockClients.length;
  const activeCases = mockCases.filter((c) => c.status !== 'closed' && c.status !== 'archived').length;
  const scheduledAppointments = mockAppointments.filter((a) => a.status === 'scheduled').length;
  const pendingPayments = mockPayments.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  const recentCases = mockCases.slice(0, 5);
  const upcomingAppointments = mockAppointments.filter((a) => a.status === 'scheduled').slice(0, 3);
  const recentActivity = mockActivityLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={isAdmin ? 'Total Clients' : 'My Clients'}
          value={totalClients}
          icon={Users}
          trend={{ value: 12, label: 'from last month' }}
        />
        <KpiCard
          title={isAdmin ? 'Active Cases' : 'My Cases'}
          value={activeCases}
          icon={Briefcase}
          trend={{ value: 8, label: 'from last month' }}
        />
        <KpiCard
          title="Appointments"
          value={scheduledAppointments}
          icon={Calendar}
        />
        <KpiCard
          title="Pending Payments"
          value={`$${pendingPayments.toLocaleString()}`}
          icon={CreditCard}
          trend={{ value: -5, label: 'from last week' }}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Button className="shadow-xs hover:shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
            <Button className="shadow-xs hover:shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
            <Button variant="outline" className="shadow-xs hover:shadow-sm">
              <FileText className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            <Button variant="outline" className="shadow-xs hover:shadow-sm">
              <Receipt className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
            <Button variant="outline" className="shadow-xs hover:shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2 border-2 border-border">
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="text-lg">Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-2 divide-border">
              {recentCases.map((caseItem) => {
                const client = getClientById(caseItem.clientId);
                return (
                  <div
                    key={caseItem.id}
                    className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{caseItem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {client?.name} • {caseItem.id}
                        </p>
                      </div>
                      <StatusBadge status={caseItem.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-2 border-border">
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-2 divide-border">
              {upcomingAppointments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No upcoming appointments
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-primary-foreground">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{apt.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(apt.date, 'MMM d')} at {apt.time}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.clientName}
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

      {/* Activity Log */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">
            {isAdmin ? 'Recent Activity' : 'My Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentActivity.map((log) => (
              <div key={log.id} className="p-4 flex items-center gap-4">
                <div className="h-2 w-2 bg-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{log.userName}</span>{' '}
                    <span className="text-muted-foreground">{log.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
