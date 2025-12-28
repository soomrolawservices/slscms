import { format } from 'date-fns';

interface InvoiceData {
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
}

export function generateInvoicePDF(invoice: InvoiceData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_id} - Soomro Law Services</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
        }
        
        /* Letterhead */
        .letterhead {
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          color: white;
          padding: 40px;
          position: relative;
        }
        
        .letterhead::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FFD700, #FFA500);
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: #006A4E;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .tagline {
          font-size: 12px;
          opacity: 0.9;
          font-style: italic;
          margin-top: 4px;
        }
        
        .company-details {
          text-align: right;
          font-size: 12px;
          opacity: 0.95;
        }
        
        .company-details p {
          margin: 2px 0;
        }
        
        /* Invoice Title */
        .invoice-title {
          background: #f8f9fa;
          padding: 30px 40px;
          border-bottom: 2px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .invoice-label {
          font-size: 32px;
          font-weight: 700;
          color: #006A4E;
          letter-spacing: 2px;
        }
        
        .invoice-number {
          text-align: right;
        }
        
        .invoice-number h3 {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .invoice-number p {
          font-size: 20px;
          font-weight: 700;
          color: #333;
        }
        
        /* Content */
        .invoice-content {
          padding: 40px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .info-section h4 {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #006A4E;
        }
        
        .info-section p {
          margin: 6px 0;
          font-size: 14px;
        }
        
        .info-section .name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        /* Table */
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        
        .invoice-table th {
          background: #006A4E;
          color: white;
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .invoice-table th:last-child {
          text-align: right;
        }
        
        .invoice-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        .invoice-table td:last-child {
          text-align: right;
          font-weight: 600;
        }
        
        .invoice-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        /* Totals */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .totals-table {
          width: 300px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .totals-row.total {
          border-bottom: none;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          color: white;
          padding: 16px;
          margin: 10px -16px -16px;
          font-size: 18px;
          font-weight: 700;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-paid {
          background: #d4edda;
          color: #155724;
        }
        
        .status-unpaid {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-overdue {
          background: #f8d7da;
          color: #721c24;
        }
        
        /* Footer */
        .invoice-footer {
          background: #f8f9fa;
          padding: 30px 40px;
          border-top: 2px solid #e9ecef;
        }
        
        .payment-info {
          margin-bottom: 20px;
        }
        
        .payment-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .payment-info p {
          font-size: 13px;
          color: #666;
        }
        
        .thank-you {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
        
        .thank-you p {
          color: #006A4E;
          font-weight: 600;
          font-size: 16px;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .invoice-container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Letterhead -->
        <header class="letterhead">
          <div class="header-content">
            <div class="logo-section">
              <div class="logo">SL</div>
              <div>
                <div class="company-name">Soomro Law Services</div>
                <div class="tagline">Just Relax! You are in Safe Hands.</div>
              </div>
            </div>
            <div class="company-details">
              <p><strong>Legal Consultants & Advocates</strong></p>
              <p>Office No. 123, Legal Complex</p>
              <p>Karachi, Pakistan</p>
              <p>Phone: +92 300 1234567</p>
              <p>Email: info@soomrolaw.com</p>
            </div>
          </div>
        </header>
        
        <!-- Invoice Title -->
        <div class="invoice-title">
          <span class="invoice-label">INVOICE</span>
          <div class="invoice-number">
            <h3>Invoice Number</h3>
            <p>${invoice.invoice_id}</p>
          </div>
        </div>
        
        <!-- Content -->
        <div class="invoice-content">
          <div class="info-grid">
            <div class="info-section">
              <h4>Bill To</h4>
              <p class="name">${invoice.client?.name || 'Client'}</p>
              ${invoice.client?.email ? `<p>Email: ${invoice.client.email}</p>` : ''}
              ${invoice.client?.phone ? `<p>Phone: ${invoice.client.phone}</p>` : ''}
              ${invoice.client?.cnic ? `<p>CNIC: ${invoice.client.cnic}</p>` : ''}
            </div>
            <div class="info-section">
              <h4>Invoice Details</h4>
              <p><strong>Issue Date:</strong> ${format(new Date(invoice.created_at), 'MMMM d, yyyy')}</p>
              <p><strong>Due Date:</strong> ${invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'Upon Receipt'}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'unpaid'}">${invoice.status.toUpperCase()}</span></p>
            </div>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Legal Services</strong><br>
                  <span style="color: #666; font-size: 13px;">
                    ${invoice.case?.title || 'Professional legal consultation and services'}
                  </span>
                </td>
                <td>PKR ${Number(invoice.amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>PKR ${Number(invoice.amount).toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>Tax (0%)</span>
                <span>PKR 0</span>
              </div>
              <div class="totals-row total">
                <span>Total Due</span>
                <span>PKR ${Number(invoice.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <footer class="invoice-footer">
          <div class="payment-info">
            <h4>Payment Information</h4>
            <p>Bank: HBL - Habib Bank Limited</p>
            <p>Account Title: Soomro Law Services</p>
            <p>Account Number: 1234-5678-9012-3456</p>
            <p>IBAN: PK12 HBLA 1234 5678 9012 3456</p>
          </div>
          <div class="thank-you">
            <p>Thank you for choosing Soomro Law Services!</p>
          </div>
        </footer>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
