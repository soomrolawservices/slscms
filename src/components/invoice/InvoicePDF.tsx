import { format } from 'date-fns';
import soomroLogo from '@/assets/soomro-law-logo.png';

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

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
  line_items?: LineItem[];
}

// Convert image to base64 for embedding in HTML
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

export async function generateInvoicePDF(invoice: InvoiceData, download: boolean = true) {
  const logoBase64 = await getLogoBase64();
  
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
          background: white;
          color: #333;
          line-height: 1.6;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          padding: 40px;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #006A4E;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        
        .logo-fallback {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 28px;
          color: white;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: 700;
          color: #006A4E;
          letter-spacing: -0.5px;
        }
        
        .tagline {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-top: 4px;
        }
        
        .company-details {
          text-align: right;
          font-size: 12px;
          color: #555;
        }
        
        .company-details p {
          margin: 3px 0;
        }
        
        .company-details strong {
          color: #006A4E;
        }
        
        /* Invoice Title Section */
        .invoice-title-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        
        .invoice-label {
          font-size: 42px;
          font-weight: 700;
          color: #006A4E;
          letter-spacing: 3px;
        }
        
        .invoice-meta {
          text-align: right;
        }
        
        .invoice-meta p {
          margin: 6px 0;
          font-size: 14px;
        }
        
        .invoice-meta strong {
          color: #333;
        }
        
        .invoice-number-badge {
          display: inline-block;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          margin-top: 8px;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .info-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #006A4E;
        }
        
        .info-section h4 {
          font-size: 12px;
          text-transform: uppercase;
          color: #006A4E;
          letter-spacing: 1px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        
        .info-section p {
          margin: 6px 0;
          font-size: 14px;
          color: #555;
        }
        
        .info-section .name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        /* Table */
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .invoice-table th {
          background: #006A4E !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: white !important;
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
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
          background: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Totals */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .totals-table {
          width: 320px;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        .totals-row:last-child {
          border-bottom: none;
        }
        
        .totals-row.total {
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: white !important;
          padding: 16px;
          margin: 10px -16px -16px;
          border-radius: 0 0 8px 8px;
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
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .status-paid {
          background: #d4edda !important;
          color: #155724 !important;
        }
        
        .status-unpaid {
          background: #fff3cd !important;
          color: #856404 !important;
        }
        
        .status-overdue {
          background: #f8d7da !important;
          color: #721c24 !important;
        }
        
        /* Footer */
        .invoice-footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e9ecef;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        
        .payment-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #006A4E;
          margin-bottom: 12px;
        }
        
        .payment-info p {
          font-size: 13px;
          color: #555;
          margin: 4px 0;
        }
        
        .notes-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #006A4E;
          margin-bottom: 12px;
        }
        
        .notes-section p {
          font-size: 13px;
          color: #555;
          font-style: italic;
        }
        
        .thank-you {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
        
        .thank-you p {
          color: #006A4E;
          font-weight: 600;
          font-size: 16px;
        }
        
        /* Download button - only shown in browser */
        .download-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 106, 78, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 1000;
        }
        
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 106, 78, 0.4);
        }
        
        @media print {
          .download-btn {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .invoice-container {
            box-shadow: none;
            padding: 20px;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <button class="download-btn" onclick="downloadPDF()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
      </button>
      
      <div class="invoice-container" id="invoice-content">
        <!-- Header -->
        <header class="header">
          <div class="logo-section">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Soomro Law Services" class="logo" />` : '<div class="logo-fallback">SL</div>'}
            <div>
              <div class="company-name">Soomro Law Services</div>
              <div class="tagline">Just Relax! You are in Safe Hands.</div>
            </div>
          </div>
          <div class="company-details">
            <p><strong>Legal Consultants & Advocates</strong></p>
            <p>Near Amir Town, U-Turn opposite to Tajbagh</p>
            <p>Lahore, Pakistan</p>
            <p>Phone: +92 309 5407616</p>
            <p>Phone: +92 314 4622396</p>
            <p>Email: soomrolawservices@gmail.com</p>
            <p>Email: soomrolawservice@gmail.com</p>
          </div>
        </header>
        
        <!-- Invoice Title -->
        <div class="invoice-title-section">
          <span class="invoice-label">INVOICE</span>
          <div class="invoice-meta">
            <p><strong>Issue Date:</strong> ${format(new Date(invoice.created_at), 'MMMM d, yyyy')}</p>
            <p><strong>Due Date:</strong> ${invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'Upon Receipt'}</p>
            <div class="invoice-number-badge">${invoice.invoice_id}</div>
          </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-section">
            <h4>Bill To</h4>
            <p class="name">${invoice.client?.name || 'Client'}</p>
            ${invoice.client?.email ? `<p>Email: ${invoice.client.email}</p>` : ''}
            ${invoice.client?.phone ? `<p>Phone: ${invoice.client.phone}</p>` : ''}
            ${invoice.client?.cnic ? `<p>CNIC: ${invoice.client.cnic}</p>` : ''}
          </div>
          <div class="info-section">
            <h4>Invoice Status</h4>
            <p><span class="status-badge status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'unpaid'}">${invoice.status.toUpperCase()}</span></p>
            ${invoice.case?.title ? `<p style="margin-top: 12px;"><strong>Case:</strong> ${invoice.case.title}</p>` : ''}
          </div>
        </div>
        
        <!-- Services Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px;">Qty</th>
              <th style="width: 120px;">Unit Price</th>
              <th style="width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.line_items && invoice.line_items.length > 0 
              ? invoice.line_items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">PKR ${Number(item.unit_price).toLocaleString()}</td>
                  <td style="text-align: right;">PKR ${Number(item.amount).toLocaleString()}</td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td>
                    <strong>Legal Services</strong><br>
                    <span style="color: #666; font-size: 13px;">
                      ${invoice.case?.title || 'Professional legal consultation and services'}
                    </span>
                  </td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">PKR ${Number(invoice.amount).toLocaleString()}</td>
                  <td style="text-align: right;">PKR ${Number(invoice.amount).toLocaleString()}</td>
                </tr>
              `
            }
          </tbody>
        </table>
        
        <!-- Totals -->
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
        
        <!-- Footer -->
        <footer class="invoice-footer">
          <div class="footer-grid">
            <div class="payment-info">
              <h4>Payment Information</h4>
              <p>Bank: HBL - Habib Bank Limited</p>
              <p>Account Title: Soomro Law Services</p>
              <p>Account Number: 1234-5678-9012-3456</p>
              <p>IBAN: PK12 HBLA 1234 5678 9012 3456</p>
            </div>
            <div class="notes-section">
              <h4>Notes</h4>
              <p>Thank you for your business. Payment is due within the specified due date. Late payments may be subject to additional charges.</p>
            </div>
          </div>
          <div class="thank-you">
            <p>Thank you for choosing Soomro Law Services!</p>
          </div>
        </footer>
      </div>
      
      <script>
        function downloadPDF() {
          // Hide download button for printing
          document.querySelector('.download-btn').style.display = 'none';
          
          // Use browser's print to PDF functionality
          window.print();
          
          // Show button again after print dialog
          setTimeout(() => {
            document.querySelector('.download-btn').style.display = 'flex';
          }, 1000);
        }
        
        // Auto-trigger based on parameter
        ${download ? `
        window.onload = function() {
          // Give a moment for styles to load
          setTimeout(() => {
            window.print();
          }, 500);
        };
        ` : ''}
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
