import type { Transaction } from "@prisma/client";
import type { ClientWithTransactions } from "@/components/finance/ClientsTable";

export type ExportFormat = "xlsx" | "csv" | "pdf";
export type ExportDataset = "ledger" | "invoices" | "clients";
export type ExportDateRange = "all" | "month" | "30days" | "custom";
export type ExportStatusFilter = "all" | "paid" | "outstanding";

export type ExportScope = {
  dataset: ExportDataset;
  dateRange: ExportDateRange;
  customFrom?: string;
  customTo?: string;
  status: ExportStatusFilter;
};

const ZYRA_HEADER_FILL = "1E293B"; // slate-800, matches the brief's "Zyra Gold / Slate #1e293b"
const ZYRA_GOLD = "98682E";

function inDateRange(date: Date, scope: ExportScope): boolean {
  const now = new Date();
  if (scope.dateRange === "all") return true;
  if (scope.dateRange === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (scope.dateRange === "30days") {
    const diff = now.getTime() - date.getTime();
    return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }
  if (scope.dateRange === "custom") {
    const from = scope.customFrom ? new Date(scope.customFrom) : null;
    const to = scope.customTo ? new Date(scope.customTo) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }
  return true;
}

function matchesStatus(tx: Transaction, scope: ExportStatusFilter): boolean {
  const isPaid = tx.status === "PAID" || tx.amountTotal - tx.amountPaid <= 0;
  if (scope === "all") return true;
  if (scope === "paid") return isPaid;
  if (scope === "outstanding") return !isPaid;
  return true;
}

export function filterTransactions(transactions: Transaction[], scope: ExportScope): Transaction[] {
  const dataset = transactions.filter((tx) => (scope.dataset === "invoices" ? tx.isCaseInvoice : true));
  return dataset.filter((tx) => inDateRange(new Date(tx.date), scope) && matchesStatus(tx, scope.status));
}

export function filterClients(clients: ClientWithTransactions[], scope: ExportScope): ClientWithTransactions[] {
  if (scope.status === "all") return clients;
  return clients.filter((c) => {
    const relevant = c.transactions.filter((tx) => tx.type === "INCOME");
    if (relevant.length === 0) return scope.status === "all";
    const hasOutstanding = relevant.some((tx) => tx.amountTotal - tx.amountPaid > 0);
    return scope.status === "outstanding" ? hasOutstanding : !hasOutstanding;
  });
}

const LEDGER_HEADERS = [
  "Reference ID", "Transaction Date", "Client / Counterparty", "Transaction Type", "Category",
  "Government Fees (AED)", "Service Fees (AED)", "Total Amount (AED)", "Paid Amount (AED)",
  "Balance (AED)", "Status", "Due Date",
];

function ledgerRows(transactions: Transaction[]): (string | number)[][] {
  return transactions.map((tx) => [
    tx.reference,
    new Date(tx.date).toISOString().split("T")[0],
    tx.counterparty,
    tx.type === "INCOME" ? "Income" : "Expense",
    tx.category,
    (tx.govFeePart || 0) / 100,
    (tx.serviceFeePart || 0) / 100,
    tx.amountTotal / 100,
    tx.amountPaid / 100,
    (tx.amountTotal - tx.amountPaid) / 100,
    tx.status,
    tx.dueDate ? new Date(tx.dueDate).toISOString().split("T")[0] : "",
  ]);
}

const CLIENT_HEADERS = [
  "Client ID", "Client Name", "Type", "Phone", "Place", "Visa / License Type",
  "Expiry Date", "Total Billed (AED)", "Outstanding Balance (AED)",
];

function clientRows(clients: ClientWithTransactions[]): (string | number)[][] {
  return clients.map((c) => {
    let totalBilled = 0;
    let outstanding = 0;
    c.transactions.forEach((tx) => {
      if (tx.type === "INCOME") {
        totalBilled += tx.amountTotal;
        outstanding += tx.amountTotal - tx.amountPaid;
      }
    });
    const expiryDate = c.type === "CORPORATE" ? c.expiryDate : c.passportExpiry;
    return [
      c.id.substring(0, 11).toUpperCase(),
      c.name,
      c.type,
      c.phone || "",
      c.place || "",
      c.type === "CORPORATE" ? "Trade License" : c.visaType || "",
      expiryDate ? new Date(expiryDate).toISOString().split("T")[0] : "",
      totalBilled / 100,
      outstanding / 100,
    ];
  });
}

const CURRENCY_COL_INDEXES = {
  ledger: [5, 6, 7, 8, 9],
  clients: [7, 8],
} as const;

export function buildExportTable(
  scope: ExportScope,
  transactions: Transaction[],
  clients: ClientWithTransactions[]
): { headers: string[]; rows: (string | number)[][]; title: string; currencyCols: number[] } {
  if (scope.dataset === "clients") {
    return {
      headers: CLIENT_HEADERS,
      rows: clientRows(filterClients(clients, scope)),
      title: "Clients Directory",
      currencyCols: [...CURRENCY_COL_INDEXES.clients],
    };
  }
  const filtered = filterTransactions(transactions, scope);
  return {
    headers: LEDGER_HEADERS,
    rows: ledgerRows(filtered),
    title: scope.dataset === "invoices" ? "Invoices & Quotations" : "Transactions Ledger",
    currencyCols: [...CURRENCY_COL_INDEXES.ledger],
  };
}

function csvField(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function exportAsCSV(headers: string[], rows: (string | number)[][], filenamePrefix: string): void {
  const csvContent = [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.csv`);
}

export async function exportAsExcel(
  headers: string[],
  rows: (string | number)[][],
  currencyCols: number[],
  filenamePrefix: string,
  sheetTitle: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Zyra CRM";
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31));

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${ZYRA_HEADER_FILL}` } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: `FF${ZYRA_GOLD}` } } };
  });
  headerRow.height = 22;

  rows.forEach((row, idx) => {
    const dataRow = sheet.addRow(row);
    const isEven = idx % 2 === 0;
    dataRow.eachCell((cell, colNumber) => {
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
      if (currencyCols.includes(colNumber - 1)) {
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right" };
      }
    });
  });

  sheet.columns.forEach((col, i) => {
    const headerLen = String(headers[i] ?? "").length;
    const maxContentLen = rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), 0);
    col.width = Math.min(Math.max(headerLen, maxContentLen) + 3, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Opens the browser print dialog with a generic A4-landscape report table (Save as PDF from there). No financial summary footer -- unlike printLedgerStatement, callers here have arbitrary column layouts. */
export function printGenericReport(headers: string[], rows: (string | number)[][], currencyCols: number[], title: string): void {
  const headerCells = headers.map((h) => `<th style="padding:8px;text-align:left;">${h}</th>`).join("");
  const tableRows = rows
    .map((row) => {
      const cells = row
        .map((val, i) => {
          const isCurrency = currencyCols.includes(i);
          const display = isCurrency ? Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
          return `<td style="padding:6px 8px;text-align:${isCurrency ? "right" : "left"};white-space:nowrap;">${display}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Zyra ${title}</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Inter', Arial, sans-serif; color: #334155; margin: 0; padding: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #98682E; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: 14px; margin: 0; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px; }
        .header p { font-size: 10px; color: #64748b; margin: 2px 0 0 0; }
        .title { font-size: 16px; font-weight: 800; color: #98682E; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        thead { background: #1e293b; color: white; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr { border-bottom: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Zyra Documents Clearance Services</h1>
          <p>C2-01, M2 Floor, Burj Nahar Complex, Al Muteena, Deira, Dubai, UAE</p>
        </div>
        <div class="title">${title}</div>
      </div>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(cleanup, 1000);
  };
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "background:#dcfce7;color:#166534;",
  PARTIALLY_PAID: "background:#fef3c7;color:#92400e;",
  PENDING: "background:#fee2e2;color:#991b1b;",
  OVERDUE: "background:#fee2e2;color:#991b1b;",
};

/** Opens the browser print dialog with an A4-landscape ledger statement (Save as PDF from there). */
export function printLedgerStatement(
  headers: string[],
  rows: (string | number)[][],
  currencyCols: number[],
  title: string
): void {
  const totals = rows.reduce(
    (acc, row) => {
      if (title !== "Clients Directory") {
        const totalIdx = 7, paidIdx = 8, balIdx = 9;
        acc.billed += Number(row[totalIdx]) || 0;
        acc.collected += Number(row[paidIdx]) || 0;
        acc.outstanding += Number(row[balIdx]) || 0;
      }
      return acc;
    },
    { billed: 0, collected: 0, outstanding: 0 }
  );

  const fmt = (n: number) => `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const statusColIdx = headers.indexOf("Status");

  const tableRows = rows
    .map((row) => {
      const cells = row
        .map((val, i) => {
          const isCurrency = currencyCols.includes(i);
          const display = isCurrency ? Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
          if (i === statusColIdx && STATUS_BADGE[String(val)]) {
            return `<td style="padding:6px 8px;text-align:${isCurrency ? "right" : "left"};"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;${STATUS_BADGE[String(val)]}">${val}</span></td>`;
          }
          return `<td style="padding:6px 8px;text-align:${isCurrency ? "right" : "left"};white-space:nowrap;">${display}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const headerCells = headers.map((h) => `<th style="padding:8px;text-align:left;">${h}</th>`).join("");

  const summaryFooter = title !== "Clients Directory" ? `
    <div style="display:flex;justify-content:flex-end;gap:24px;margin-top:16px;padding-top:12px;border-top:2px solid #98682E;font-size:11px;">
      <div><span style="color:#64748b;">Total Billed:</span> <strong>${fmt(totals.billed)}</strong></div>
      <div><span style="color:#64748b;">Total Collected:</span> <strong style="color:#166534;">${fmt(totals.collected)}</strong></div>
      <div><span style="color:#64748b;">Outstanding Balance:</span> <strong style="color:#991b1b;">${fmt(totals.outstanding)}</strong></div>
    </div>
  ` : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Zyra ${title}</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Inter', Arial, sans-serif; color: #334155; margin: 0; padding: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #98682E; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: 14px; margin: 0; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px; }
        .header p { font-size: 10px; color: #64748b; margin: 2px 0 0 0; }
        .title { font-size: 16px; font-weight: 800; color: #98682E; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        thead { background: #1e293b; color: white; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr { border-bottom: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Zyra Documents Clearance Services</h1>
          <p>C2-01, M2 Floor, Burj Nahar Complex, Al Muteena, Deira, Dubai, UAE</p>
        </div>
        <div class="title">${title}</div>
      </div>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      ${summaryFooter}
    </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(cleanup, 1000);
  };
}
