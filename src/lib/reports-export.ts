// Reports export utilities for PDF and Excel
import { format } from 'date-fns';

interface ReportData {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    totalInvoiced: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    collectionRate: number;
    activeCases: number;
    pendingCases: number;
    closedCases: number;
    totalClients: number;
    activeClients: number;
    individualClients: number;
    corporateClients: number;
  };
  monthlyData: Array<{
    month: string;
    fullMonth: string;
    revenue: number;
    expense: number;
    profit: number;
    newClients: number;
    newCases: number;
    invoiceCount: number;
    paidInvoices: number;
    collectionRate: number;
  }>;
  dateRange: string;
}

const formatCurrency = (value: number) => `PKR ${value.toLocaleString()}`;

export function exportReportsToPDF(data: ReportData, activeTab: string = 'all') {
  const generatedDate = new Date().toLocaleString();

  const financialSection = `
    <div class="section">
      <h2 class="section-title">Financial Summary</h2>
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">${formatCurrency(data.stats.totalRevenue)}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value">${formatCurrency(data.stats.totalExpenses)}</div>
        </div>
        <div class="stat-card ${data.stats.profit >= 0 ? 'success' : 'danger'}">
          <div class="stat-label">Net Profit</div>
          <div class="stat-value">${formatCurrency(data.stats.profit)}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Collection Rate</div>
          <div class="stat-value">${data.stats.collectionRate.toFixed(1)}%</div>
        </div>
      </div>
      
      <h3 class="table-title">Monthly Revenue vs Expenses</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue</th>
            <th>Expenses</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyData.map((m, i) => `
            <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
              <td>${m.fullMonth}</td>
              <td class="text-success">${formatCurrency(m.revenue)}</td>
              <td class="text-danger">${formatCurrency(m.expense)}</td>
              <td class="${m.profit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(m.profit)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const invoicesSection = `
    <div class="section">
      <h2 class="section-title">Invoices Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Invoiced</div>
          <div class="stat-value">${formatCurrency(data.stats.totalInvoiced)}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Paid</div>
          <div class="stat-value">${formatCurrency(data.stats.paidInvoices)}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Unpaid</div>
          <div class="stat-value">${formatCurrency(data.stats.unpaidInvoices)}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">${formatCurrency(data.stats.overdueInvoices)}</div>
        </div>
      </div>
      
      <h3 class="table-title">Monthly Invoice Trend</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Invoices</th>
            <th>Paid Invoices</th>
            <th>Collection Rate</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyData.map((m, i) => `
            <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
              <td>${m.fullMonth}</td>
              <td>${m.invoiceCount}</td>
              <td>${m.paidInvoices}</td>
              <td>${m.collectionRate.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const casesSection = `
    <div class="section">
      <h2 class="section-title">Cases Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Cases</div>
          <div class="stat-value">${data.stats.activeCases + data.stats.pendingCases + data.stats.closedCases}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Active</div>
          <div class="stat-value">${data.stats.activeCases}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${data.stats.pendingCases}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Closed</div>
          <div class="stat-value">${data.stats.closedCases}</div>
        </div>
      </div>
      
      <h3 class="table-title">Monthly New Cases Trend</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>New Cases</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyData.map((m, i) => `
            <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
              <td>${m.fullMonth}</td>
              <td>${m.newCases}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const clientsSection = `
    <div class="section">
      <h2 class="section-title">Clients Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Clients</div>
          <div class="stat-value">${data.stats.totalClients}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Active</div>
          <div class="stat-value">${data.stats.activeClients}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">Individual</div>
          <div class="stat-value">${data.stats.individualClients}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Corporate</div>
          <div class="stat-value">${data.stats.corporateClients}</div>
        </div>
      </div>
      
      <h3 class="table-title">Monthly New Clients Trend</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>New Clients</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyData.map((m, i) => `
            <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
              <td>${m.fullMonth}</td>
              <td>${m.newClients}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const allSections = activeTab === 'all' 
    ? financialSection + invoicesSection + casesSection + clientsSection
    : activeTab === 'financial' ? financialSection
    : activeTab === 'invoices' ? invoicesSection
    : activeTab === 'cases' ? casesSection
    : activeTab === 'clients' ? clientsSection
    : financialSection;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reports - Soomro Law Services</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background: white;
          color: #333;
          line-height: 1.6;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .container { max-width: 1100px; margin: 0 auto; padding: 40px; }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 30px;
          border-bottom: 3px solid #006A4E;
          margin-bottom: 30px;
        }
        
        .logo-section { display: flex; align-items: center; gap: 16px; }
        .logo {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 24px; color: white !important;
        }
        .company-name { font-size: 24px; font-weight: 700; color: #006A4E; }
        .tagline { font-size: 11px; color: #666; font-style: italic; }
        .company-details { text-align: right; font-size: 11px; color: #555; }
        .company-details p { margin: 2px 0; }
        
        .report-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          border-radius: 8px;
        }
        .report-title h1 { color: white !important; font-size: 24px; font-weight: 700; }
        .report-meta { text-align: right; color: rgba(255,255,255,0.9) !important; font-size: 12px; }
        .report-meta p { margin: 2px 0; }
        
        .section { margin-bottom: 40px; page-break-inside: avoid; }
        .section-title { font-size: 20px; font-weight: 700; color: #006A4E; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
        .stat-card {
          background: #f8f9fa !important;
          padding: 16px 20px;
          border-radius: 8px;
          border-left: 4px solid #006A4E;
        }
        .stat-card.success { border-left-color: #10b981; }
        .stat-card.danger { border-left-color: #ef4444; }
        .stat-card.warning { border-left-color: #f59e0b; }
        .stat-card.info { border-left-color: #3b82f6; }
        .stat-label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 700; color: #006A4E; }
        
        .table-title { font-size: 16px; font-weight: 600; color: #333; margin: 20px 0 10px; }
        table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
        th {
          background: #006A4E !important;
          color: white !important;
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td { padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
        tr.even { background: #f8f9fa !important; }
        tr.odd { background: white !important; }
        .text-success { color: #10b981; font-weight: 600; }
        .text-danger { color: #ef4444; font-weight: 600; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #666;
        }
        .footer-brand { display: flex; align-items: center; gap: 8px; }
        .mini-logo {
          width: 24px; height: 24px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 10px; color: white !important;
        }
        .confidential { color: #dc3545; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        
        .download-btn {
          position: fixed; top: 20px; right: 20px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%);
          color: white; border: none; padding: 12px 24px;
          border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 106, 78, 0.3); z-index: 1000;
        }
        .download-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 106, 78, 0.4); }
        
        @media print {
          .download-btn { display: none !important; }
          body { background: white !important; }
          .container { padding: 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <button class="download-btn" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
      </button>
      
      <div class="container">
        <header class="header">
          <div class="logo-section">
            <div class="logo">SL</div>
            <div>
              <div class="company-name">Soomro Law Services</div>
              <div class="tagline">Just Relax! You are in Safe Hands.</div>
            </div>
          </div>
          <div class="company-details">
            <p><strong>Legal Consultants & Advocates</strong></p>
            <p>Near Amir Town, U-Turn opposite to Tajbagh</p>
            <p>Lahore, Pakistan</p>
            <p>Phone: +92 309 5407616 | +92 314 4622396</p>
          </div>
        </header>
        
        <div class="report-title">
          <h1>Business Analytics Report</h1>
          <div class="report-meta">
            <p><strong>Period:</strong> ${data.dateRange}</p>
            <p><strong>Generated:</strong> ${generatedDate}</p>
            <p><strong>Report ID:</strong> RPT-${Date.now().toString(36).toUpperCase()}</p>
          </div>
        </div>
        
        ${allSections}
        
        <footer class="footer">
          <div class="footer-brand">
            <div class="mini-logo">SL</div>
            <span>Soomro Law Services CMS - Business Analytics Report</span>
          </div>
          <div class="confidential">Confidential</div>
          <div>Page 1 of 1</div>
        </footer>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

export function exportReportsToExcel(data: ReportData) {
  // Create CSV content for Excel compatibility
  const rows: string[][] = [];
  
  // Header section
  rows.push(['SOOMRO LAW SERVICES - BUSINESS ANALYTICS REPORT']);
  rows.push([`Period: ${data.dateRange}`]);
  rows.push([`Generated: ${format(new Date(), 'PPpp')}`]);
  rows.push([]);
  
  // Financial Summary
  rows.push(['FINANCIAL SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Revenue', formatCurrency(data.stats.totalRevenue)]);
  rows.push(['Total Expenses', formatCurrency(data.stats.totalExpenses)]);
  rows.push(['Net Profit', formatCurrency(data.stats.profit)]);
  rows.push(['Collection Rate', `${data.stats.collectionRate.toFixed(1)}%`]);
  rows.push([]);
  
  // Invoices Summary
  rows.push(['INVOICES SUMMARY']);
  rows.push(['Total Invoiced', formatCurrency(data.stats.totalInvoiced)]);
  rows.push(['Paid Invoices', formatCurrency(data.stats.paidInvoices)]);
  rows.push(['Unpaid Invoices', formatCurrency(data.stats.unpaidInvoices)]);
  rows.push(['Overdue Invoices', formatCurrency(data.stats.overdueInvoices)]);
  rows.push([]);
  
  // Cases Summary
  rows.push(['CASES SUMMARY']);
  rows.push(['Active Cases', data.stats.activeCases.toString()]);
  rows.push(['Pending Cases', data.stats.pendingCases.toString()]);
  rows.push(['Closed Cases', data.stats.closedCases.toString()]);
  rows.push([]);
  
  // Clients Summary
  rows.push(['CLIENTS SUMMARY']);
  rows.push(['Total Clients', data.stats.totalClients.toString()]);
  rows.push(['Active Clients', data.stats.activeClients.toString()]);
  rows.push(['Individual Clients', data.stats.individualClients.toString()]);
  rows.push(['Corporate Clients', data.stats.corporateClients.toString()]);
  rows.push([]);
  
  // Monthly Data
  rows.push(['MONTHLY TREND DATA']);
  rows.push(['Month', 'Revenue', 'Expenses', 'Profit', 'New Clients', 'New Cases', 'Invoices', 'Paid Invoices', 'Collection Rate']);
  data.monthlyData.forEach(m => {
    rows.push([
      m.fullMonth,
      m.revenue.toString(),
      m.expense.toString(),
      m.profit.toString(),
      m.newClients.toString(),
      m.newCases.toString(),
      m.invoiceCount.toString(),
      m.paidInvoices.toString(),
      `${m.collectionRate.toFixed(1)}%`
    ]);
  });

  // Convert to CSV
  const csvContent = rows.map(row => 
    row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
        ? `"${escaped}"` 
        : escaped;
    }).join(',')
  ).join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `soomro-law-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
