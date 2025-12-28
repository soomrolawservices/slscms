// Export utilities for PDF and Excel with branded Soomro Law Services design

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T | string; header: string }[],
  filename: string
) {
  // Create header row
  const headers = columns.map((col) => col.header);
  
  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key as keyof T];
      // Handle special cases
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value ?? '');
    })
  );

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => 
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T | string; header: string }[],
  filename: string,
  title: string
) {
  const headers = columns.map((col) => 
    `<th>${col.header}</th>`
  ).join('');
  
  const rows = data.map((item, index) => {
    const cells = columns.map((col) => {
      const value = item[col.key as keyof T];
      let displayValue = '';
      if (value instanceof Date) {
        displayValue = value.toLocaleDateString();
      } else if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value);
      } else {
        displayValue = String(value ?? '');
      }
      return `<td>${displayValue}</td>`;
    }).join('');
    return `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
  }).join('');

  const totalRecords = data.length;
  const generatedDate = new Date().toLocaleString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Soomro Law Services</title>
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
        
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 30px;
          border-bottom: 3px solid #006A4E;
          margin-bottom: 30px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: white !important;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #006A4E;
        }
        
        .tagline {
          font-size: 11px;
          color: #666;
          font-style: italic;
        }
        
        .company-details {
          text-align: right;
          font-size: 11px;
          color: #555;
        }
        
        .company-details p {
          margin: 2px 0;
        }
        
        /* Report Title */
        .report-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border-radius: 8px;
        }
        
        .report-title h1 {
          color: white !important;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        
        .report-meta {
          text-align: right;
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 12px;
        }
        
        .report-meta p {
          margin: 2px 0;
        }
        
        /* Stats Row */
        .stats-row {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          flex: 1;
          background: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          padding: 16px 20px;
          border-radius: 8px;
          border-left: 4px solid #006A4E;
        }
        
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #006A4E;
        }
        
        /* Table */
        table { 
          width: 100%;
          border-collapse: collapse; 
          margin-bottom: 30px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th {
          background: #006A4E !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: white !important;
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #e9ecef;
          font-size: 13px;
        }
        
        tr.even {
          background: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        tr.odd {
          background: white !important;
        }
        
        /* Footer */
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
        
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .footer-brand .mini-logo {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #006A4E 0%, #00857C 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 10px;
          color: white !important;
        }
        
        .confidential {
          color: #dc3545;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        /* Download button */
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
          
          .container {
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
      
      <div class="container">
        <!-- Header -->
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
            <p>Email: soomrolawservices@gmail.com</p>
          </div>
        </header>
        
        <!-- Report Title -->
        <div class="report-title">
          <h1>${title}</h1>
          <div class="report-meta">
            <p><strong>Generated:</strong> ${generatedDate}</p>
            <p><strong>Report ID:</strong> RPT-${Date.now().toString(36).toUpperCase()}</p>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-label">Total Records</div>
            <div class="stat-value">${totalRecords}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Report Type</div>
            <div class="stat-value" style="font-size: 16px;">${title}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Export Date</div>
            <div class="stat-value" style="font-size: 16px;">${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        
        <!-- Data Table -->
        <table>
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        
        <!-- Footer -->
        <footer class="footer">
          <div class="footer-brand">
            <div class="mini-logo">SL</div>
            <span>Soomro Law Services CMS - Confidential Document</span>
          </div>
          <div class="confidential">Confidential</div>
          <div>Page 1 of 1</div>
        </footer>
      </div>
      
      <script>
        function downloadPDF() {
          document.querySelector('.download-btn').style.display = 'none';
          window.print();
          setTimeout(() => {
            document.querySelector('.download-btn').style.display = 'flex';
          }, 1000);
        }
      </script>
    </body>
    </html>
  `;

  // Open in new window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
