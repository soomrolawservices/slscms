import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Briefcase, FileText, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useDocuments } from '@/hooks/useDocuments';
import { useAppointments } from '@/hooks/useAppointments';
import { format } from 'date-fns';

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const { data: payments = [] } = usePayments();
  const { data: invoices = [] } = useInvoices();
  const { data: documents = [] } = useDocuments();
  const { data: appointments = [] } = useAppointments();

  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client not found</h2>
          <Button onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const clientCases = (cases as any[]).filter(c => c.client_id === clientId);
  const clientPayments = payments.filter(p => p.client_id === clientId);
  const clientInvoices = invoices.filter(i => i.client_id === clientId);
  const clientDocuments = documents.filter(d => d.client_id === clientId);
  const clientAppointments = appointments.filter(a => a.client_id === clientId);

  const totalPaid = clientPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = clientInvoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
                {client.name}
                <StatusBadge status={client.status} />
              </h1>
              <p className="text-muted-foreground capitalize">{client.client_type} Client</p>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              <span>Cases</span>
            </div>
            <p className="text-2xl font-bold mt-1">{clientCases.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </div>
            <p className="text-2xl font-bold mt-1">{clientDocuments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Total Paid</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">Rs. {totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-orange-600">Rs. {totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="border-2 border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client.region && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.region}</span>
              </div>
            )}
            {client.cnic && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{client.cnic}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Client since {format(new Date(client.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card className="border-2 border-border lg:col-span-2">
          <Tabs defaultValue="cases" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start border-2 border-border">
                <TabsTrigger value="cases">Cases ({clientCases.length})</TabsTrigger>
                <TabsTrigger value="payments">Payments ({clientPayments.length})</TabsTrigger>
                <TabsTrigger value="documents">Documents ({clientDocuments.length})</TabsTrigger>
                <TabsTrigger value="appointments">Appointments ({clientAppointments.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="cases" className="mt-0">
                <ScrollArea className="h-[300px]">
                  {clientCases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No cases found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientCases.map((caseItem) => (
                        <div key={caseItem.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{caseItem.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated {format(new Date(caseItem.updated_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <StatusBadge status={caseItem.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <ScrollArea className="h-[300px]">
                  {clientPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No payments found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientPayments.map((payment) => (
                        <div key={payment.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{payment.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy') : 'No date'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Rs. {payment.amount.toLocaleString()}</p>
                              <StatusBadge status={payment.status} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <ScrollArea className="h-[300px]">
                  {clientDocuments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDocuments.map((doc) => (
                        <div key={doc.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {doc.document_type || 'Document'} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="appointments" className="mt-0">
                <ScrollArea className="h-[300px]">
                  {clientAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No appointments found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientAppointments.map((apt) => (
                        <div key={apt.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{apt.topic}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(apt.date), 'MMM d, yyyy')} at {apt.time}
                              </p>
                            </div>
                            <StatusBadge status={apt.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
