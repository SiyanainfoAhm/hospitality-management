export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printInvoice(invoiceHtml: string) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4A017; padding-bottom: 16px; margin-bottom: 24px; }
        .hotel-name { font-size: 18px; font-weight: bold; color: #1E2A44; }
        .meta { font-size: 12px; color: #666; }
        .guest-info { background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 12px; color: #555; border-bottom: 1px solid #ddd; }
        td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 16px; border-top: 2px solid #eee; padding-top: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .grand-total { font-weight: bold; font-size: 16px; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
        .text-right { text-align: right; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>${invoiceHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

export function generateInvoiceHTML(invoice: {
  number: string;
  date: string;
  guest: string;
  guest_email?: string;
  room: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
}, items: { description: string; quantity: number; unit_price: number; total_price: number }[]) {
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

  const itemRows = items.map((item) => `
    <tr>
      <td>${item.description}</td>
      <td class="text-right">${item.quantity}</td>
      <td class="text-right">${formatINR(item.unit_price)}</td>
      <td class="text-right">${formatINR(item.total_price)}</td>
    </tr>
  `).join("");

  return `
    <div class="header">
      <div>
        <div class="hotel-name">IIM Nagpur Guest House</div>
        <div class="meta">GSTIN: 27AAACI1234F1Z5</div>
        <div class="meta">IIM Nagpur, MIHAN, Nagpur - 441108</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:600">${invoice.number}</div>
        <div class="meta">Date: ${invoice.date}</div>
        <div class="meta" style="text-transform:capitalize">Status: ${invoice.status.replace("_", " ")}</div>
      </div>
    </div>

    <div class="guest-info">
      <div style="font-weight:500">${invoice.guest}</div>
      <div class="meta">Room ${invoice.room}</div>
      ${invoice.guest_email ? `<div class="meta">${invoice.guest_email}</div>` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="4" style="text-align:center;color:#999">No line items</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatINR(invoice.subtotal)}</span></div>
      ${invoice.discount > 0 ? `<div class="total-row" style="color:green"><span>Discount</span><span>-${formatINR(invoice.discount)}</span></div>` : ""}
      <div class="total-row"><span>GST (18%)</span><span>${formatINR(invoice.tax)}</span></div>
      <div class="total-row grand-total"><span>Grand Total</span><span>${formatINR(invoice.total)}</span></div>
      <div class="total-row" style="color:green"><span>Paid</span><span>${formatINR(invoice.paid)}</span></div>
      ${invoice.balance > 0 ? `<div class="total-row" style="color:red"><span>Balance Due</span><span>${formatINR(invoice.balance)}</span></div>` : ""}
    </div>
  `;
}

export function downloadPDF(invoice: {
  number: string;
  date: string;
  guest: string;
  guest_email?: string;
  room: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
}, items: { description: string; quantity: number; unit_price: number; total_price: number }[]) {
  const html = generateInvoiceHTML(invoice, items);
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.number}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4A017; padding-bottom: 16px; margin-bottom: 24px; }
        .hotel-name { font-size: 18px; font-weight: bold; color: #1E2A44; }
        .meta { font-size: 12px; color: #666; }
        .guest-info { background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 12px; color: #555; border-bottom: 1px solid #ddd; }
        td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 16px; border-top: 2px solid #eee; padding-top: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .grand-total { font-weight: bold; font-size: 16px; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
        .text-right { text-align: right; }
        .save-note { text-align: center; color: #888; font-size: 12px; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #ccc; }
        @media print { .save-note { display: none; } body { padding: 20px; } }
      </style>
    </head>
    <body>
      ${html}
      <div class="save-note">To save as PDF: Press Ctrl+P (or Cmd+P) → Select "Save as PDF" as destination → Click Save</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}
