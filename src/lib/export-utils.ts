// Export utilities for PDF and Excel

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
  // Create a printable HTML document
  const headers = columns.map((col) => `<th style="border: 1px solid #000; padding: 8px; background: #f0f0f0;">${col.header}</th>`).join('');
  
  const rows = data.map((item) => {
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
      return `<td style="border: 1px solid #000; padding: 8px;">${displayValue}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
