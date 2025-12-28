import { format } from 'date-fns';

interface InvoiceTemplateProps {
  invoice: {
    invoice_id: string;
    amount: number;
    due_date: string | null;
    status: string;
    created_at: string;
  };
  client: {
    name: string;
    email?: string | null;
    phone?: string | null;
    cnic?: string | null;
    region?: string | null;
  } | null;
  caseName?: string | null;
}

export function InvoiceTemplate({ invoice, client, caseName }: InvoiceTemplateProps) {
  return (
    <div className="bg-white text-gray-900 p-8 max-w-3xl mx-auto" id="invoice-print">
      {/* Header with Branding */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#006A4E] via-[#00857C] to-[#006A4E] p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">SL</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Soomro Law Services</h1>
                <p className="text-emerald-200 text-sm italic">Just Relax! You are in Safe Hands.</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold mb-2">INVOICE</p>
            <p className="text-emerald-200 font-mono">{invoice.invoice_id}</p>
          </div>
        </div>
        
        {/* Contact Info Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-100">
          <span>📞 03095407616</span>
          <span>📞 03144622396</span>
          <span>✉️ soomrolawservices@gmail.com</span>
          <span>🌐 soomrolawservices.lovable.app</span>
        </div>
      </div>

      {/* Invoice Body */}
      <div className="border-x-2 border-b-2 border-gray-200 rounded-b-2xl">
        {/* Client & Invoice Info */}
        <div className="grid grid-cols-2 gap-8 p-8 bg-gray-50">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
            <p className="text-lg font-semibold text-gray-900">{client?.name || 'Client'}</p>
            {client?.email && <p className="text-gray-600 text-sm">{client.email}</p>}
            {client?.phone && <p className="text-gray-600 text-sm">{client.phone}</p>}
            {client?.cnic && <p className="text-gray-600 text-sm">CNIC: {client.cnic}</p>}
            {client?.region && <p className="text-gray-600 text-sm">{client.region}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 block">Invoice Date</span>
                <span className="font-medium">{format(new Date(invoice.created_at), 'MMMM d, yyyy')}</span>
              </div>
              {invoice.due_date && (
                <div>
                  <span className="text-xs text-gray-500 block">Due Date</span>
                  <span className="font-medium">{format(new Date(invoice.due_date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  invoice.status === 'paid' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4">
                  <p className="font-medium text-gray-900">Legal Services</p>
                  {caseName && <p className="text-sm text-gray-500">Case: {caseName}</p>}
                </td>
                <td className="py-4 text-right font-medium text-gray-900">
                  Rs. {invoice.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {invoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">Tax (0%)</span>
                  <span className="font-medium">Rs. 0</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 bg-gradient-to-r from-[#006A4E] to-[#00857C] -mx-4 px-4 rounded-lg text-white mt-2">
                  <span className="text-lg font-bold">Total Due</span>
                  <span className="text-lg font-bold">Rs. {invoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-200 rounded-b-2xl">
          <p className="text-sm text-gray-500 mb-2">Thank you for trusting Soomro Law Services with your legal matters.</p>
          <p className="text-xs text-gray-400">
            Payment is due within 30 days of invoice date. For questions, contact us at soomrolawservices@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}