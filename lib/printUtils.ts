import { companyLogoSvg, getDefaultCompanyBranding, type CompanyBranding } from "@/lib/companyBrandingDefaults";
import { getBranding } from "@/app/actions/branding";
import { amountToWordsAED } from "@/lib/numberToWords";

export type DocumentType = 'QUOTATION' | 'TAX_INVOICE' | 'PAYMENT_RECEIPT';

export interface LineItem {
  desc: string;
  govCost: number;
  proFee: number;
}

interface BasePrintData {
  clientName: string;
  date: string;
  reference?: string;
  dueDate?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompanyName?: string;
  clientTRN?: string;
  clientDocumentRef?: string;
}

interface QuotationData extends BasePrintData {
  type: 'QUOTATION';
  govCost: number;
  proFee: number;
  expiry: string;
  notes: string;
  total: number;
  lineItems?: LineItem[];
  terms?: string;
}

interface TaxInvoiceData extends BasePrintData {
  type: 'TAX_INVOICE';
  caseRef: string;
  govCost: number;
  proFee: number;
  vatAmount: number;
  totalPayable: number;
  amountReceived?: number;
  lineItems?: LineItem[];
  terms?: string;
}

export const DEFAULT_QUOTATION_TERMS = `1. Quotation Validity: Valid for 14 days from the date of issue.
2. Government Fees: Estimated based on current portal tariffs and billed at actual cost; revisions by authorities will be reflected in final billing.
3. Payment Structure: 100% government fees and 50% service charge required in advance to initiate document clearance.
4. Documentation: Client is fully responsible for the authenticity and validity of all submitted documents.`;

export const DEFAULT_TAX_INVOICE_TERMS = `1. Payment Due: Full settlement required within 7 days of invoice date.
2. Government Pass-Throughs: Government portal fees are strictly non-refundable once processed.
3. Payment Reference: Please mention the invoice number in bank transfers and share payment receipt.
4. VAT: 5% VAT applies only to professional service charges as per UAE FTA guidelines.`;

interface PaymentReceiptData extends BasePrintData {
  type: 'PAYMENT_RECEIPT';
  voucherRef?: string;
  invoiceRef: string;
  amount: number;
  method: string;
  previousTotal?: number;
  remainingBalance?: number;
  transactionRef?: string;
  depositedTo?: string;
  purpose?: string;
}

type PrintData = QuotationData | TaxInvoiceData | PaymentReceiptData;

const ZYRA_BRONZE = '#98682E';
const ZYRA_DARK = '#0F172A';

/**
 * Verifies a network logo URL actually loads before committing to render it
 * -- a broken/unreachable Settings logoUrl (bad upload, dead link, CORS
 * block) would otherwise leave a blank image gap in the printed header with
 * no company name to fall back on. data: URIs (the built-in Zyra wordmark,
 * or a base64 upload) can't fail a network fetch, so those skip the check.
 */
function loadImageOk(url: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') {
      resolve(false);
      return;
    }
    const img = new window.Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    setTimeout(() => finish(false), timeoutMs);
    img.src = url;
  });
}

/** Exported for reuse by other print-to-PDF/iframe builders (e.g. client statements) that render their own header. */
export async function resolveLogo(branding: CompanyBranding): Promise<{ markup: string; hasRealLogo: boolean }> {
  const initials = branding.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  const fallback = companyLogoSvg(initials, 44);

  if (!branding.logoUrl) return { markup: fallback, hasRealLogo: false };

  const isDataUri = branding.logoUrl.startsWith('data:');
  const loadsOk = isDataUri || (await loadImageOk(branding.logoUrl));
  if (!loadsOk) return { markup: fallback, hasRealLogo: false };

  return {
    markup: `<img src="${branding.logoUrl}" alt="${branding.name}" style="height: 44px; width: auto; max-width: 210px; object-fit: contain; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />`,
    hasRealLogo: true,
  };
}

async function buildDocumentContent(
  data: PrintData,
  branding: CompanyBranding = getDefaultCompanyBranding()
): Promise<{ documentTitle: string; header: string; content: string; whatsappLink: string }> {
  const formatCurrency = (amount: number) =>
    `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let documentTitle = "";
  if (data.type === 'QUOTATION') documentTitle = 'OFFICIAL QUOTATION';
  if (data.type === 'TAX_INVOICE') documentTitle = 'TAX INVOICE';
  if (data.type === 'PAYMENT_RECEIPT') documentTitle = 'OFFICIAL PAYMENT ACKNOWLEDGMENT RECEIPT';

  // Real uploaded/default logos already contain the company name as a
  // wordmark, so the header never renders a separate text heading next to
  // it -- that would just duplicate the brand name. The generated-initials
  // SVG fallback has no text baked in, so it's paired with a bold heading
  // instead of leaving a broken/empty image gap (also used whenever the
  // configured logoUrl fails to actually load).
  const { markup: logoMarkup, hasRealLogo } = await resolveLogo(branding);

  // Compact circular icon badges for contact metadata, in place of plain
  // text labels -- mirrors the app's own rounded icon-badge convention.
  const ICON_PHONE = '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>';
  const ICON_WHATSAPP = '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />';
  const ICON_PIN = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
  const ICON_GLOBE = '<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/><path d="M2 12h20"/>';
  const ICON_MAIL = '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>';

  const iconBadge = (path: string) => `
    <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #f1f5f9; flex-shrink: 0;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${ZYRA_BRONZE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
    </span>
  `;

  const contactRow = (path: string, text: string) => `
    <div style="display: flex; align-items: center; gap: 5px; justify-content: flex-end;">
      <span style="white-space: nowrap;">${text}</span>
      ${iconBadge(path)}
    </div>
  `;

  const contactItems = [
    branding.phone ? contactRow(ICON_PHONE, branding.phone) : null,
    branding.whatsapp ? contactRow(ICON_WHATSAPP, branding.whatsapp) : null,
    contactRow(ICON_PIN, branding.address),
    branding.website ? contactRow(ICON_GLOBE, branding.website) : null,
    branding.email ? contactRow(ICON_MAIL, branding.email) : null,
  ].filter(Boolean).join('');

  const invoiceNoLine = data.reference
    ? `<p style="color: ${ZYRA_DARK}; margin: 2px 0 0 0; font-size: 12px; font-weight: 700;">Invoice No: ${data.reference}</p>`
    : '';

  const header = `
    <div style="border-bottom: 2px solid ${ZYRA_BRONZE}; padding-bottom: 10px; margin-bottom: 14px; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="flex-shrink: 0; display: flex; align-items: center; gap: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          ${logoMarkup}
          <div>
            ${!hasRealLogo ? `<h1 style="color: ${ZYRA_DARK}; margin: 0; font-size: 15px; font-weight: 800; line-height: 1.15; letter-spacing: -0.3px; text-transform: uppercase;">${branding.name}</h1>` : ''}
            ${branding.nameAr ? `<p dir="rtl" style="color: #64748b; margin: 2px 0 0 0; font-size: 11px; font-weight: 600;">${branding.nameAr}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #64748b; line-height: 1.6; display: flex; flex-direction: column; gap: 2px;">
          ${contactItems}
          ${branding.trn ? `<div style="color: ${ZYRA_DARK}; font-weight: 700; margin-top: 2px;">TRN: ${branding.trn}</div>` : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; margin-top: 14px;">
        <!-- Left Metadata -->
        <div>
          <h2 style="color: ${ZYRA_BRONZE}; margin: 0 0 2px 0; font-size: 16px; font-weight: 800; text-transform: uppercase;">${documentTitle}</h2>
          ${invoiceNoLine}
          <table style="width: 100%; font-size: 11px; color: #475569; border-spacing: 0; line-height: 1.3; margin-top: 4px;">
            <tr><td style="padding: 1px 0; width: 110px;"><strong>Issue Date:</strong></td><td>${data.date}</td></tr>
            ${data.dueDate ? `<tr><td style="padding: 1px 0;"><strong>Due Date:</strong></td><td>${data.dueDate}</td></tr>` : ''}
            <tr><td style="padding: 1px 0;"><strong>Currency:</strong></td><td>AED</td></tr>
          </table>
        </div>

        <!-- Right Metadata -->
        <div>
          <h3 style="color: ${ZYRA_DARK}; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Billed To</h3>
          <table style="width: 100%; font-size: 11px; color: #475569; border-spacing: 0; line-height: 1.3;">
            <tr><td style="padding: 1px 0; width: 110px;"><strong>Client Name:</strong></td><td><strong style="color: ${ZYRA_DARK};">${data.clientName}</strong></td></tr>
            ${data.clientCompanyName ? `<tr><td style="padding: 1px 0;"><strong>Company:</strong></td><td>${data.clientCompanyName}</td></tr>` : ''}
            ${data.clientPhone ? `<tr><td style="padding: 1px 0;"><strong>Phone:</strong></td><td>${data.clientPhone}</td></tr>` : ''}
            ${data.clientEmail ? `<tr><td style="padding: 1px 0;"><strong>Email:</strong></td><td>${data.clientEmail}</td></tr>` : ''}
            ${data.clientTRN ? `<tr><td style="padding: 1px 0;"><strong>Corporate TRN:</strong></td><td>${data.clientTRN}</td></tr>` : ''}
            ${data.clientDocumentRef ? `<tr><td style="padding: 1px 0;"><strong>EID / Passport / TL:</strong></td><td>${data.clientDocumentRef}</td></tr>` : ''}
          </table>
        </div>
      </div>
    </div>
  `;

  let content = '';

  if (data.type === 'QUOTATION' || data.type === 'TAX_INVOICE') {
    const govCost = data.type === 'QUOTATION' ? (data as QuotationData).govCost : (data as TaxInvoiceData).govCost;
    const proFee = data.type === 'QUOTATION' ? (data as QuotationData).proFee : (data as TaxInvoiceData).proFee;
    const vatAmount = data.type === 'QUOTATION' ? 0 : (data as TaxInvoiceData).vatAmount;
    const isQuotation = data.type === 'QUOTATION';
    const totalPayable = isQuotation ? (data as QuotationData).total : (data as TaxInvoiceData).totalPayable;
    const amountReceived = data.type === 'TAX_INVOICE' ? (data as TaxInvoiceData).amountReceived || 0 : 0;
    const outstandingBalance = data.type === 'TAX_INVOICE' ? totalPayable - amountReceived : totalPayable;
    
    const items = (data as any).lineItems || [
      { desc: isQuotation ? 'Professional Service Fee' : 'Professional PRO & Agency Fee', govCost, proFee }
    ];

    const subtotal = govCost + proFee;

    const PRICE_FONT = "font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-variant-numeric: tabular-nums;";

    let itemRows = '';
    items.forEach((item: LineItem, i: number) => {
      const lineTotal = item.govCost + item.proFee;
      itemRows += `
        <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <td style="padding: 12px 14px; text-align: center; vertical-align: middle; line-height: 1.4;">${i + 1}</td>
          <td style="padding: 12px 14px; text-align: left; vertical-align: middle; line-height: 1.4;">${item.desc}</td>
          <td style="padding: 12px 14px; text-align: center; vertical-align: middle; line-height: 1.4;">1</td>
          <td style="padding: 12px 14px; text-align: right; vertical-align: middle; line-height: 1.4; ${PRICE_FONT}">${formatCurrency(lineTotal)}</td>
          <td style="padding: 12px 14px; text-align: right; vertical-align: middle; line-height: 1.4; ${PRICE_FONT}">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    });

    const itemsTableHtml = `
      <div style="margin-bottom: 12px; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px;">
          <thead>
            <tr style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 12px 14px; text-align: center; vertical-align: middle; width: 36px;">#</th>
              <th style="padding: 12px 14px; text-align: left; vertical-align: middle;">Description / Service Details</th>
              <th style="padding: 12px 14px; text-align: center; vertical-align: middle; width: 50px;">Qty</th>
              <th style="padding: 12px 14px; text-align: right; vertical-align: middle; width: 110px; ${PRICE_FONT}">Unit Price (AED)</th>
              <th style="padding: 12px 14px; text-align: right; vertical-align: middle; width: 110px; ${PRICE_FONT}">Total (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
    `;

    const paidBadge = !isQuotation
      ? amountReceived <= 0
        ? `<span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: #f1f5f9; color: #64748b;">UNPAID</span>`
        : outstandingBalance > 0
          ? `<span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: #fee2e2; color: #dc2626;">PARTIALLY PAID</span>`
          : `<span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: #dcfce7; color: #059669;">PAID</span>`
      : '';

    content = `
      ${itemsTableHtml}

      <!-- Clean Financial Summary -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="width: 300px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <div style="padding: 8px 12px; background-color: #f8fafc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; color: #475569;">
              <span>Subtotal:</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #475569;">
              <span>VAT (5%):</span>
              <span>${formatCurrency(isQuotation ? 0 : vatAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 2px solid ${ZYRA_BRONZE}; font-size: 14px; font-weight: 900; color: ${ZYRA_DARK};">
              <span>TOTAL PAYABLE: ${paidBadge}</span>
              <span>${formatCurrency(totalPayable)}</span>
            </div>
            ${!isQuotation ? `
              <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #475569;">
                <span>Amount Received:</span>
                <span>${formatCurrency(amountReceived)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #cbd5e1; font-size: 12px; font-weight: bold; color: ${outstandingBalance > 0 ? '#dc2626' : '#059669'};">
                <span>OUTSTANDING BALANCE:</span>
                <span>${formatCurrency(outstandingBalance)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Terms & Conditions -- context-specific defaults, user-editable at creation time -->
      <div style="page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px 10px; margin-bottom: 8px; font-size: 10px; color: #475569;">
        <strong style="color: ${ZYRA_DARK}; text-transform: uppercase; letter-spacing: 0.3px;">Terms & Conditions:</strong>
        <ol style="margin: 2px 0 0 0; padding-left: 16px; line-height: 1.5;">
          ${(
            (data as QuotationData | TaxInvoiceData).terms ||
            (isQuotation ? branding.quotationTerms : branding.paymentTerms) ||
            (isQuotation ? DEFAULT_QUOTATION_TERMS : DEFAULT_TAX_INVOICE_TERMS)
          )
            .split('\n')
            .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
            .filter(Boolean)
            .map((line) => `<li>${line}</li>`)
            .join('')}
          ${(branding.bankName || branding.iban) ? `<li>Bank Transfer:${branding.bankName ? ` ${branding.bankName}` : ''}${branding.iban ? ` &bull; IBAN: ${branding.iban}` : ''}${branding.swift ? ` &bull; SWIFT: ${branding.swift}` : ''}</li>` : ''}
        </ol>
        ${isQuotation && (data as QuotationData).notes ? `<p style="margin: 4px 0 0 0;"><strong>Notes:</strong> ${(data as QuotationData).notes}</p>` : ''}
      </div>

      <!-- Signatures + footer combined into one slim bar -->
      <div style="page-break-inside: avoid; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px;">
        <div style="width: 40%; text-align: center;">
          <div style="height: 24px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 3px; font-size: 9px; color: #64748b;">Authorized Signatory &mdash; ${branding.name}</div>
        </div>
        <div style="flex: 1; text-align: center; font-size: 9px; color: #94a3b8;">
          Thank you for choosing ${branding.name}${branding.portalUrl ? ` &bull; ${branding.portalUrl}` : ''}
        </div>
        <div style="width: 40%; text-align: center;">
          <div style="height: 24px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 3px; font-size: 9px; color: #64748b;">Client Acceptance / Stamp &mdash; ${data.clientName}</div>
        </div>
      </div>
    `;
  } else if (data.type === 'PAYMENT_RECEIPT') {
    const d = data as PaymentReceiptData;
    content = `
      <div style="max-width: 480px; margin: 12px auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        ${d.voucherRef ? `
        <div style="background-color: ${ZYRA_DARK}; color: white; padding: 8px 16px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center;">
          VOUCHER REF: ${d.voucherRef}
        </div>
        ` : ''}
        <!-- Payment Breakdown Box -->
        <div style="background-color: #f8fafc; padding: 24px 20px; text-align: center; border-bottom: 1px solid #cbd5e1;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: bold;">Amount Received (AED)</p>
          <div style="font-size: 32px; font-weight: 900; color: ${ZYRA_BRONZE}; margin-bottom: 8px; line-height: 1;">
            ${formatCurrency(d.amount)}
          </div>
          <p style="color: #475569; font-size: 11px; font-style: italic; margin: 0 0 12px 0;">${amountToWordsAED(d.amount)}</p>
          <span style="display: inline-block; padding: 5px 14px; background-color: #10b981; color: white; font-size: 11px; font-weight: bold; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Payment Successful
          </span>
        </div>

        <div style="padding: 18px 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; border-spacing: 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Payment Mode:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.method}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Transaction / Cheque Ref:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.transactionRef || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Linked Invoice / Case Ref:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.invoiceRef || 'N/A'}</td>
            </tr>
            ${d.depositedTo ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Deposited To:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.depositedTo}</td>
            </tr>
            ` : ''}
            ${d.purpose ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; vertical-align: top;"><strong>Purpose:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.purpose}</td>
            </tr>
            ` : ''}
            ${d.previousTotal !== undefined ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Previous Invoiced Total:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${formatCurrency(d.previousTotal)}</td>
            </tr>
            ` : ''}
            ${d.remainingBalance !== undefined ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Balance Pending:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${d.remainingBalance > 0 ? '#dc2626' : '#10b981'};">${formatCurrency(Math.max(0, d.remainingBalance))}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>

      <!-- Verification Footer -->
      <div style="margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; max-width: 480px; margin-left: auto; margin-right: auto;">
        <div style="text-align: center; width: 42%;">
          <div style="height: 30px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 3px; font-size: 10px; color: #64748b;">Received By</div>
        </div>
        <div style="text-align: center; width: 42%;">
          <div style="width: 60px; height: 60px; margin: 0 auto; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 8px; text-transform: uppercase; font-weight: bold; transform: rotate(-15deg);">
            Stamp
          </div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 3px; margin-top: 4px; font-size: 10px; color: #64748b;">Authorized Signatory</div>
        </div>
      </div>

      <!-- Footer disclaimer -- company-wide default, editable in Company Settings -->
      <p style="max-width: 480px; margin: 16px auto 0 auto; text-align: center; font-size: 9px; color: #94a3b8;">
        ${branding.receiptFooterNote || 'This is a computer-generated receipt and does not require a physical signature.'}
      </p>
    `;
  }

  let totalWhatsApp = 0;
  if (data.type === 'QUOTATION' || data.type === 'TAX_INVOICE') {
    const isQuotation = data.type === 'QUOTATION';
    totalWhatsApp = isQuotation ? (data as QuotationData).total : (data as TaxInvoiceData).totalPayable;
  } else {
    totalWhatsApp = (data as PaymentReceiptData).amount;
  }
  
  const formattedTotal = formatCurrency(totalWhatsApp);
  const waPhone = (data.clientPhone || '').replace(/\D/g, ''); // Strip non-digits
  
  let waMessage = `Dear ${data.clientName},\n\nGreetings from Zyra Documents Clearance Services.\n`;
  if (data.type === 'QUOTATION') {
    waMessage += `Please find your Official Quotation (${data.reference}) attached/linked. The total estimated value is *${formattedTotal}*.\n\nKindly review and confirm so we may proceed.\n`;
  } else if (data.type === 'TAX_INVOICE') {
    const txData = data as TaxInvoiceData;
    waMessage += `Please find your Official Tax Invoice (${txData.caseRef || 'attached'}) for the amount of *${formattedTotal}*.\n\nKindly arrange the payment at your earliest convenience.\n`;
  } else if (data.type === 'PAYMENT_RECEIPT') {
    const prData = data as PaymentReceiptData;
    waMessage += `We have successfully received your payment of *${formattedTotal}* via ${prData.method} against invoice ${prData.invoiceRef}.\n\nThank you for choosing Zyra!\n`;
  }
  waMessage += `\nBest regards,\nZyra Operations Team`;
  
  const whatsappLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  return { documentTitle, header, content, whatsappLink };
}

/** Assembles the full standalone HTML page once branding+content are known. */
async function assembleHTML(data: PrintData, branding: CompanyBranding): Promise<string> {
  const { documentTitle, header, content, whatsappLink } = await buildDocumentContent(data, branding);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documentTitle} - ZYRA</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.25;
          color: #334155;
          margin: 0 auto;
          padding: 24px;
          background-color: white;
          max-width: 800px;
        }
        .action-bar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          padding: 15px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          z-index: 50;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          margin: -40px -40px 30px -40px;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .btn-print {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .btn-whatsapp {
          background: #22c55e;
          color: white;
        }
        .print-sheet {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          .action-bar {
            display: none !important;
          }
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            padding: 0;
            margin: 0;
            max-width: none;
            font-size: 11.5px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="action-bar">
        <a href="${whatsappLink}" target="_blank" class="btn btn-whatsapp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
          Share via WhatsApp
        </a>
        <button onclick="window.print()" class="btn btn-print">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Download PDF / Print
        </button>
      </div>
      <div class="print-sheet">
        ${header}
        ${content}
      </div>
    </body>
    </html>
  `;
}

function getFilename(data: PrintData): string {
  const ref =
    data.reference ||
    (data.type === 'TAX_INVOICE' ? data.caseRef : undefined) ||
    (data.type === 'PAYMENT_RECEIPT' ? data.invoiceRef : undefined) ||
    'document';
  const safeRef = String(ref).replace(/[^a-zA-Z0-9-_]/g, '_');
  return `Zyra_${data.type}_${safeRef}.pdf`;
}

/**
 * Print via a hidden same-page iframe instead of window.open(). A new
 * window/tab opened after an `await` (e.g. once createInvoice() resolves)
 * falls outside the browser's "direct user gesture" window and gets
 * silently popup-blocked on mobile Safari/Chrome and most modern desktop
 * browsers -- that was the root cause of PDF export failing in production.
 * An iframe never opens a new browsing context, so it isn't subject to
 * that block at all.
 */
export function printViaIframe(data: PrintData, branding?: CompanyBranding): void {
  if (!branding) {
    // No pre-fetched branding: resolve it first, but this reintroduces the
    // gesture-timing gap the iframe approach otherwise avoids. Callers with
    // a UI (the document modals) should always pass a pre-fetched branding.
    getBranding()
      .catch(() => getDefaultCompanyBranding())
      .then((b) => printViaIframe(data, b));
    return;
  }

  assembleHTML(data, branding).then((html) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    };

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      throw new Error('Unable to open print preview.');
    }

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(cleanup, 1000);
    };
  });
}

/**
 * Generates a real PDF client-side (html2canvas -> jsPDF), formatted for
 * A4, and triggers a direct download via Blob + temporary anchor. Runs
 * entirely in the current tab -- no new window, no Chromium/Puppeteer,
 * so it works the same on mobile and in Vercel's serverless environment.
 */
export async function downloadDocumentPDF(data: PrintData, branding?: CompanyBranding): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }, resolvedBranding] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    branding ? Promise.resolve(branding) : getBranding().catch(() => getDefaultCompanyBranding()),
  ]);

  const { header, content } = await buildDocumentContent(data, resolvedBranding);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 @ 96dpi
  container.style.padding = '40px';
  container.style.background = '#ffffff';
  container.style.fontFamily =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.color = '#334155';
  container.innerHTML = header + content;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Content taller than one A4 page: paginate by shifting the same
      // full-height image up on each subsequent page.
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilename(data);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

/** Legacy name kept for existing call sites; now iframe-based (see printViaIframe). */
export function printDocument(data: PrintData) {
  printViaIframe(data);
}
