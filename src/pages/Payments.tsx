import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockPayments, getClientById, getCaseById } from '@/data/mockData';
import type { Payment } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Payments() {
  const [payments, setPayments] = useState(mockPayments);
  const [activeTab, setActiveTab] = useState('all');

  const filteredPayments = payments.filter((p) =>
    activeTab === 'all' ? true : p.status === activeTab
  );

  const columns: Column<Payment>[] = [
    {
      key: 'id',
      header: 'Payment ID',
      render: (row) => <span className="font-mono text-sm">{row.id}</span>,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-bold">${row.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'clientId',
      header: 'Client',
      render: (row) => getClientById(row.clientId)?.name || 'Unknown',
    },
    {
      key: 'caseId',
      header: 'Case',
      render: (row) => row.caseId ? getCaseById(row.caseId)?.id || '-' : '-',
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => format(row.date, 'MMM d, yyyy'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleDelete = (payment: Payment) => {
    setPayments(payments.filter((p) => p.id !== payment.id));
    toast({
      title: 'Payment deleted',
      description: `${payment.id} has been removed.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Payments
          </h1>
          <p className="text-muted-foreground">
            Track payment records and transactions
          </p>
        </div>
        <Button className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredPayments}
            columns={columns}
            searchPlaceholder="Search payments..."
            searchKey="title"
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
