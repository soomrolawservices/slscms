import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, FileText, Receipt, Calendar, CreditCard, Settings, LayoutDashboard, Key, MessageSquare } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useDocuments } from '@/hooks/useDocuments';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', keywords: ['home', 'overview', 'stats'] },
  { name: 'Clients', icon: Users, path: '/clients', keywords: ['customer', 'contact'] },
  { name: 'Cases', icon: Briefcase, path: '/cases', keywords: ['matter', 'legal'] },
  { name: 'Documents', icon: FileText, path: '/documents', keywords: ['file', 'upload'] },
  { name: 'Payments', icon: CreditCard, path: '/payments', keywords: ['money', 'transaction'] },
  { name: 'Invoices', icon: Receipt, path: '/invoices', keywords: ['bill', 'billing'] },
  { name: 'Appointments', icon: Calendar, path: '/appointments', keywords: ['meeting', 'schedule'] },
  { name: 'Messages', icon: MessageSquare, path: '/messages', keywords: ['chat', 'communication'] },
  { name: 'Credentials', icon: Key, path: '/credentials', keywords: ['password', 'login'] },
  { name: 'Settings', icon: Settings, path: '/settings', keywords: ['config', 'preferences'] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const { data: documents = [] } = useDocuments();
  const { data: invoices = [] } = useInvoices();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search clients, cases, documents..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Navigation */}
          <CommandGroup heading="Quick Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.path}
                value={`${item.name} ${item.keywords.join(' ')}`}
                onSelect={() => runCommand(() => navigate(item.path))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Clients */}
          {clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.slice(0, 5).map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client ${client.name} ${client.email || ''} ${client.phone || ''}`}
                  onSelect={() => runCommand(() => navigate(`/clients?search=${encodeURIComponent(client.name)}`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    <span className="text-xs text-muted-foreground">{client.email || client.phone || 'No contact'}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Cases */}
          {cases.length > 0 && (
            <CommandGroup heading="Cases">
              {(cases as any[]).slice(0, 5).map((caseItem) => (
                <CommandItem
                  key={caseItem.id}
                  value={`case ${caseItem.title} ${caseItem.status}`}
                  onSelect={() => runCommand(() => navigate(`/cases?search=${encodeURIComponent(caseItem.title)}`))}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{caseItem.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">{caseItem.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <CommandGroup heading="Documents">
              {documents.slice(0, 5).map((doc) => (
                <CommandItem
                  key={doc.id}
                  value={`document ${doc.title} ${doc.document_type || ''}`}
                  onSelect={() => runCommand(() => navigate(`/documents?search=${encodeURIComponent(doc.title)}`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{doc.title}</span>
                    <span className="text-xs text-muted-foreground">{doc.document_type || 'Document'}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Invoices */}
          {isAdmin && invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {invoices.slice(0, 5).map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  value={`invoice ${invoice.invoice_id} ${invoice.status}`}
                  onSelect={() => runCommand(() => navigate(`/invoices?search=${encodeURIComponent(invoice.invoice_id)}`))}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{invoice.invoice_id}</span>
                    <span className="text-xs text-muted-foreground capitalize">{invoice.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
