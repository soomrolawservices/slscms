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

// Generate Client Invoice PDF for download
import soomroLogo from '@/assets/soomro-law-logo.png';

interface ClientInvoiceData {
  invoice_id: string;
  amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
  client?: {
    name: string;
    email?: string;
    phone?: string;
    cnic?: string;
  };
  case?: {
    title: string;
  };
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

async function getLogoBase64(): Promise<string> {
  try {
    const response = await fetch(soomroLogo);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export async function generateClientInvoicePDF(invoice: ClientInvoiceData) {
  const logoBase64 = await getLogoBase64();
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_id} - Soomro Law Services</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; -webkit-print-color-adjust: exact !important; }
        .wrapper { max-width: 850px; margin: 0 auto; padding: 40px 20px 100px; }
        .container { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #006A4E 0%, #00857C 100%); padding: 40px; color: white; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
        .logo-section { display: flex; align-items: center; gap: 16px; }
        .logo { width: 70px; height: 70px; object-fit: contain; background: white; border-radius: 12px; padding: 8px; }
        .logo-fallback { width: 70px; height: 70px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; color: #006A4E; }
        .company-info h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .company-info .tagline { font-size: 12px; opacity: 0.9; font-style: italic; }
        .invoice-badge { text-align: right; }
        .invoice-badge .label { font-size: 14px; opacity: 0.9; margin-bottom: 4px; }
        .invoice-badge .number { font-size: 28px; font-weight: 700; }
        .main { padding: 40px; }
        .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .info-card { background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
        .info-card h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
        .info-card .name { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .info-card p { font-size: 13px; color: #64748b; margin: 4px 0; }
        .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-unpaid { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .date-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .date-item { text-align: center; padding: 16px; background: #f1f5f9; border-radius: 8px; }
        .date-item label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        .date-item span { font-size: 15px; font-weight: 600; color: #1e293b; }
        .table-wrapper { margin-bottom: 30px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .invoice-table { width: 100%; border-collapse: collapse; }
        .invoice-table th { background: #006A4E; color: white; padding: 14px 20px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .invoice-table th:last-child { text-align: right; }
        .invoice-table td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
        .invoice-table td:last-child { text-align: right; font-weight: 600; }
        .invoice-table tr:last-child td { border-bottom: none; }
        .invoice-table tr:nth-child(even) { background: #f8fafc; }
        .totals-section { display: flex; justify-content: flex-end; }
        .totals-card { width: 320px; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .totals-row { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
        .totals-row:last-child { border-bottom: none; }
        .totals-row.total { background: linear-gradient(135deg, #006A4E 0%, #00857C 100%); color: white; font-size: 18px; font-weight: 700; padding: 18px 20px; }
        .footer { margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .footer-section h4 { font-size: 13px; font-weight: 600; color: #006A4E; margin-bottom: 12px; }
        .footer-section p { font-size: 13px; color: #64748b; margin: 4px 0; }
        .thank-you { text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, rgba(0,106,78,0.05), rgba(0,133,124,0.05)); border-radius: 12px; }
        .thank-you p { font-size: 16px; font-weight: 600; color: #006A4E; }
        .thank-you small { font-size: 12px; color: #64748b; }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 16px 24px; box-shadow: 0 -4px 24px rgba(0,0,0,0.1); display: flex; justify-content: center; gap: 12px; z-index: 1000; }
        .download-btn { background: linear-gradient(135deg, #006A4E 0%, #00857C 100%); color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .download-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,106,78,0.3); }
        .print-btn { background: white; color: #006A4E; border: 2px solid #006A4E; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        @media print { .download-bar { display: none !important; } body { background: white; } .wrapper { padding: 0; } .container { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="download-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Print</button>
        <button class="download-btn" onclick="window.print()">📥 Download PDF</button>
      </div>
      <div class="wrapper">
        <div class="container">
          <header class="header">
            <div class="header-content">
              <div class="logo-section">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : '<div class="logo-fallback">SL</div>'}
                <div class="company-info">
                  <h1>Soomro Law Services</h1>
                  <p class="tagline">Just Relax! You are in Safe Hands.</p>
                </div>
              </div>
              <div class="invoice-badge">
                <p class="label">Invoice Number</p>
                <p class="number">${invoice.invoice_id}</p>
              </div>
            </div>
          </header>
          <div class="main">
            <div class="info-row">
              <div class="info-card">
                <h3>Billed To</h3>
                <p class="name">${invoice.client?.name || 'Client'}</p>
                ${invoice.client?.email ? `<p>📧 ${invoice.client.email}</p>` : ''}
                ${invoice.client?.phone ? `<p>📱 ${invoice.client.phone}</p>` : ''}
                ${invoice.client?.cnic ? `<p>🆔 ${invoice.client.cnic}</p>` : ''}
              </div>
              <div class="info-card">
                <h3>Payment Status</h3>
                <span class="status-badge status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'unpaid'}">${invoice.status.toUpperCase()}</span>
                ${invoice.case?.title ? `<p style="margin-top: 16px;"><strong>Case:</strong> ${invoice.case.title}</p>` : ''}
              </div>
            </div>
            <div class="date-grid">
              <div class="date-item"><label>Issue Date</label><span>${format(new Date(invoice.created_at), 'MMM d, yyyy')}</span></div>
              <div class="date-item"><label>Due Date</label><span>${invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'Upon Receipt'}</span></div>
              <div class="date-item"><label>Amount Due</label><span style="color: #006A4E;">PKR ${invoice.amount.toLocaleString()}</span></div>
            </div>
            <div class="table-wrapper">
              <table class="invoice-table">
                <thead><tr><th>Description</th><th style="width: 80px; text-align: center;">Qty</th><th style="width: 120px; text-align: right;">Rate</th><th style="width: 120px;">Amount</th></tr></thead>
                <tbody>
                  ${invoice.line_items && invoice.line_items.length > 0 
                    ? invoice.line_items.map(item => `<tr><td>${item.description}</td><td style="text-align: center;">${item.quantity}</td><td style="text-align: right;">PKR ${item.unit_price.toLocaleString()}</td><td>PKR ${item.amount.toLocaleString()}</td></tr>`).join('')
                    : `<tr><td>Legal Services</td><td style="text-align: center;">1</td><td style="text-align: right;">PKR ${invoice.amount.toLocaleString()}</td><td>PKR ${invoice.amount.toLocaleString()}</td></tr>`
                  }
                </tbody>
              </table>
            </div>
            <div class="totals-section">
              <div class="totals-card">
                <div class="totals-row"><span>Subtotal</span><span>PKR ${invoice.amount.toLocaleString()}</span></div>
                <div class="totals-row"><span>Tax (0%)</span><span>PKR 0</span></div>
                <div class="totals-row total"><span>Total Due</span><span>PKR ${invoice.amount.toLocaleString()}</span></div>
              </div>
            </div>
            <div class="footer">
              <div class="footer-grid">
                <div class="footer-section"><h4>Payment Information</h4><p><strong>Bank:</strong> Bank of Punjab</p><p><strong>Account Title:</strong> Soomro Law Services</p></div>
                <div class="footer-section"><h4>Contact Us</h4><p>📞 +92 309 5407616 / +92 314 4622396</p><p>✉️ soomrolawservices@gmail.com</p></div>
              </div>
              <div class="thank-you"><p>Thank you for your business!</p><small>If you have any questions about this invoice, please contact us</small></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}