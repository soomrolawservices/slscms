import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Download } from 'lucide-react';
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
import { mockInvoices, getClientById, getCaseById } from '@/data/mockData';
import type { Invoice } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Invoices() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [activeTab, setActiveTab] = useState('all');

  const filteredInvoices = invoices.filter((inv) =>
    activeTab === 'all' ? true : inv.status === activeTab
  );

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      header: 'Invoice ID',
      render: (row) => <span className="font-mono text-sm">{row.id}</span>,
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
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (row) => format(row.dueDate, 'MMM d, yyyy'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleDelete = (invoice: Invoice) => {
    setInvoices(invoices.filter((i) => i.id !== invoice.id));
    toast({
      title: 'Invoice deleted',
      description: `${invoice.id} has been removed.`,
    });
  };

  const handleExportPDF = (invoice: Invoice) => {
    toast({
      title: 'Exporting PDF',
      description: `Downloading ${invoice.id}.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Invoices
          </h1>
          <p className="text-muted-foreground">
            Manage billing and invoices
          </p>
        </div>
        <Button className="shadow-xs">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredInvoices}
            columns={columns}
            searchPlaceholder="Search invoices..."
            searchKey="id"
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
                  <DropdownMenuItem onClick={() => handleExportPDF(row)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
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
