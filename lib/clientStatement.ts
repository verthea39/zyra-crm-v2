import type { Client, Transaction, TransactionPayment } from "@prisma/client";
import { getDefaultCompanyBranding, type CompanyBranding } from "@/lib/companyBrandingDefaults";
import { resolveLogo } from "@/lib/printUtils";

export type StatementRange = "month" | "last3months" | "ytd" | "custom" | "all";

export type StatementScope = {
  range: StatementRange;
  customFrom?: string;
  customTo?: string;
};

/** Start of the selected range, or null for "all" (nothing precedes it). */
function rangeStart(scope: StatementScope): Date | null {
  const now = new Date();
  if (scope.range === "all") return null;
  if (scope.range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (scope.range === "last3months") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (scope.range === "ytd") return new Date(now.getFullYear(), 0, 1);
  if (scope.range === "custom") return scope.customFrom ? new Date(scope.customFrom) : null;
  return null;
}

function inRange(date: Date, scope: StatementScope): boolean {
  const now = new Date();
  if (scope.range === "all") return true;
  if (scope.range === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (scope.range === "last3months") {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return date >= from && date <= now;
  }
  if (scope.range === "ytd") {
    const from = new Date(now.getFullYear(), 0, 1);
    return date >= from && date <= now;
  }
  if (scope.range === "custom") {
    const from = scope.customFrom ? new Date(scope.customFrom) : null;
    const to = scope.customTo ? new Date(scope.customTo) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }
  return true;
}

type StatementRow = {
  date: Date;
  reference: string;
  description: string;
  debit: number; // minor units
  credit: number; // minor units
  runningBalance: number; // minor units
};

/** Prints an A4-portrait client account statement (Save as PDF from the browser print dialog). */
export async function printClientStatement(
  client: Pick<Client, "name" | "phone" | "email" | "place" | "trnNumber" | "type">,
  invoices: (Transaction & { payments: TransactionPayment[] })[],
  scope: StatementScope,
  branding: CompanyBranding = getDefaultCompanyBranding()
): Promise<void> {
  type RawRow = Omit<StatementRow, "runningBalance">;
  const rawRows: RawRow[] = [];

  for (const tx of invoices) {
    if (inRange(new Date(tx.date), scope)) {
      rawRows.push({
        date: new Date(tx.date),
        reference: tx.reference,
        description: tx.category || "Service Charge",
        debit: tx.amountTotal,
        credit: 0,
      });
    }
    for (const payment of tx.payments) {
      if (inRange(new Date(payment.paidAt), scope)) {
        rawRows.push({
          date: new Date(payment.paidAt),
          reference: tx.reference,
          description: `Payment received${payment.method ? ` (${payment.method})` : ""}`,
          debit: 0,
          credit: payment.amountMinor,
        });
      }
    }
  }

  rawRows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Balance brought forward from before the selected range -- without this,
  // a payment received inside the range for an invoice issued before it
  // shows up as a lone credit with no matching debit, producing a bogus
  // negative "outstanding balance" for the period.
  const start = rangeStart(scope);
  let openingBalance = 0;
  if (start) {
    for (const tx of invoices) {
      if (new Date(tx.date) < start) openingBalance += tx.amountTotal;
      for (const payment of tx.payments) {
        if (new Date(payment.paidAt) < start) openingBalance -= payment.amountMinor;
      }
    }
  }

  let running = openingBalance;
  const rows: StatementRow[] = rawRows.map((r) => {
    running += r.debit - r.credit;
    return { ...r, runningBalance: running };
  });

  const totalBilled = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.credit, 0);
  const outstanding = openingBalance + totalBilled - totalPaid;

  const fmt = (minor: number) => `AED ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: Date) => d.toLocaleDateString("en-GB");

  const openingRow = start
    ? `<tr style="background:#f8fafc;font-style:italic;">
        <td style="padding:6px 8px;">${fmtDate(start)}</td>
        <td style="padding:6px 8px;"></td>
        <td style="padding:6px 8px;">Balance Brought Forward</td>
        <td style="padding:6px 8px;text-align:right;"></td>
        <td style="padding:6px 8px;text-align:right;"></td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;">${fmt(openingBalance)}</td>
      </tr>`
    : "";

  const tableRows = rows.length
    ? openingRow + rows
        .map(
          (r) => `
        <tr>
          <td style="padding:6px 8px;">${fmtDate(r.date)}</td>
          <td style="padding:6px 8px;font-family:monospace;">${r.reference}</td>
          <td style="padding:6px 8px;">${r.description}</td>
          <td style="padding:6px 8px;text-align:right;">${r.debit > 0 ? fmt(r.debit) : ""}</td>
          <td style="padding:6px 8px;text-align:right;">${r.credit > 0 ? fmt(r.credit) : ""}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:700;">${fmt(r.runningBalance)}</td>
        </tr>`
        )
        .join("")
    : openingRow || `<tr><td colspan="6" style="padding:16px;text-align:center;color:#94a3b8;font-style:italic;">No activity in this period.</td></tr>`;

  // Reuses printUtils' logo preload check -- a broken/unreachable Settings
  // logoUrl falls back cleanly instead of leaving a blank image gap.
  const { markup: logoMarkup, hasRealLogo } = await resolveLogo(branding);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Zyra Statement -- ${client.name}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Inter', Arial, sans-serif; color: #334155; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          border-bottom: 2px solid #98682E;
          padding-bottom: 12px;
          margin-bottom: 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header h1 { font-size: 15px; margin: 0 0 3px 0; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px; }
        .header .brand-block { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
        .header .brand-block img { height: 56px !important; width: auto; max-width: 200px; object-fit: contain; display: block; flex-shrink: 0; }
        .header .brand-text { text-align: left; }
        .header .brand-text p { font-size: 10.5px; color: #64748b; margin: 1px 0 0 0; line-height: 1.5; }
        .header .doc-title { text-align: right; flex-shrink: 0; }
        .title { font-size: 19px; font-weight: 800; color: #98682E; text-transform: uppercase; white-space: nowrap; }
        .title-meta { font-size: 10px; color: #94a3b8; margin-top: 4px; }
        .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 11px; display: flex; justify-content: space-between; gap: 16px; }
        .client-box strong { color: #0F172A; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
        thead { background: #1e293b; color: white; }
        thead th { padding: 8px; text-align: left; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr { border-bottom: 1px solid #e2e8f0; }
        .summary { display: flex; justify-content: flex-end; }
        .summary-card { width: 260px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .summary-card .row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 11px; }
        .summary-card .row.total { border-top: 2px solid #98682E; font-weight: 800; font-size: 13px; background: #FDF8F0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand-block">
          ${logoMarkup}
          <div class="brand-text">
            ${!hasRealLogo ? `<h1>${branding.name}</h1>` : ""}
            <p>${branding.address}</p>
            ${[branding.phone && `Tel: ${branding.phone}`, branding.whatsapp && `WhatsApp: ${branding.whatsapp}`].filter(Boolean).length
              ? `<p>${[branding.phone && `Tel: ${branding.phone}`, branding.whatsapp && `WhatsApp: ${branding.whatsapp}`].filter(Boolean).join(" &nbsp;|&nbsp; ")}</p>`
              : ""}
            ${[branding.email, branding.website].filter(Boolean).length
              ? `<p>${[branding.email, branding.website].filter(Boolean).join(" &nbsp;|&nbsp; ")}</p>`
              : ""}
            ${branding.trn ? `<p>Company TRN: ${branding.trn}</p>` : ""}
          </div>
        </div>
        <div class="doc-title">
          <div class="title">Account Statement</div>
          <div class="title-meta">Generated: ${fmtDate(new Date())}</div>
        </div>
      </div>

      <div class="client-box">
        <div>
          <strong>${client.name}</strong><br/>
          ${client.phone ? `Tel: ${client.phone}<br/>` : ""}
          ${client.email ? `${client.email}<br/>` : ""}
          ${client.place ? `${client.place}` : ""}
        </div>
        ${client.type === "CORPORATE" && client.trnNumber ? `<div style="text-align:right;">Client TRN:<br/><strong>${client.trnNumber}</strong></div>` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Particulars</th>
            <th style="text-align:right;">Debit (AED)</th>
            <th style="text-align:right;">Credit (AED)</th>
            <th style="text-align:right;">Running Balance (AED)</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="summary">
        <div class="summary-card">
          ${start ? `<div class="row"><span>Opening Balance</span><strong>${fmt(openingBalance)}</strong></div>` : ""}
          <div class="row"><span>Total Billed</span><strong>${fmt(totalBilled)}</strong></div>
          <div class="row"><span>Total Paid</span><strong style="color:#166534;">${fmt(totalPaid)}</strong></div>
          <div class="row total"><span>Outstanding Balance</span><span style="color:${outstanding > 0 ? "#991b1b" : "#166534"};">${fmt(outstanding)}</span></div>
        </div>
      </div>
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
