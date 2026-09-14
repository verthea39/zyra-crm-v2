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
}

interface PaymentReceiptData extends BasePrintData {
  type: 'PAYMENT_RECEIPT';
  invoiceRef: string;
  amount: number;
  method: string;
  previousTotal?: number;
  remainingBalance?: number;
  transactionRef?: string;
}

type PrintData = QuotationData | TaxInvoiceData | PaymentReceiptData;

const ZYRA_BRONZE = '#98682E';
const ZYRA_DARK = '#0F172A';

function generateHTML(data: PrintData): string {
  const formatCurrency = (amount: number) => `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  let documentTitle = "";
  if (data.type === 'QUOTATION') documentTitle = 'OFFICIAL QUOTATION';
  if (data.type === 'TAX_INVOICE') documentTitle = 'TAX INVOICE';
  if (data.type === 'PAYMENT_RECEIPT') documentTitle = 'OFFICIAL PAYMENT ACKNOWLEDGMENT RECEIPT';

  const header = `
    <div style="border-bottom: 3px solid ${ZYRA_BRONZE}; padding-bottom: 25px; margin-bottom: 35px;">
      <h1 style="color: ${ZYRA_DARK}; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">ZYRA DOCUMENTS CLEARANCE SERVICES</h1>
      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Corporate PRO & Government Transaction Solutions — Deira / Burj Nahar, Dubai, UAE</p>
      
      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
        <!-- Left Metadata -->
        <div style="width: 48%;">
          <h2 style="color: ${ZYRA_BRONZE}; margin: 0 0 10px 0; font-size: 22px; text-transform: uppercase;">${documentTitle}</h2>
          <table style="width: 100%; font-size: 13px; color: #475569; border-spacing: 0;">
            ${data.reference ? `<tr><td style="padding: 3px 0; width: 130px;"><strong>Reference Number:</strong></td><td>${data.reference}</td></tr>` : ''}
            <tr><td style="padding: 3px 0; width: 130px;"><strong>Issue Date:</strong></td><td>${data.date}</td></tr>
            ${data.dueDate ? `<tr><td style="padding: 3px 0;"><strong>Due Date:</strong></td><td>${data.dueDate}</td></tr>` : ''}
          </table>
        </div>
        
        <!-- Right Metadata -->
        <div style="width: 48%;">
          <h3 style="color: ${ZYRA_DARK}; margin: 0 0 10px 0; font-size: 16px;">BILLED TO</h3>
          <table style="width: 100%; font-size: 13px; color: #475569; border-spacing: 0;">
            <tr><td style="padding: 3px 0; width: 130px;"><strong>Client Name:</strong></td><td><strong style="color: ${ZYRA_DARK};">${data.clientName}</strong></td></tr>
            ${data.clientTRN ? `<tr><td style="padding: 3px 0;"><strong>Corporate TRN:</strong></td><td>${data.clientTRN}</td></tr>` : ''}
            ${data.clientPhone ? `<tr><td style="padding: 3px 0;"><strong>Contact Phone:</strong></td><td>${data.clientPhone}</td></tr>` : ''}
            ${data.clientDocumentRef ? `<tr><td style="padding: 3px 0;"><strong>EID / Passport / TL:</strong></td><td>${data.clientDocumentRef}</td></tr>` : ''}
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
      { desc: isQuotation ? 'Guaranteed Zyra Professional Fee' : 'Zyra Professional PRO & Agency Fee', govCost, proFee }
    ];

    let govRows = '';
    let proRows = '';
    
    items.forEach((item: LineItem, i: number) => {
      govRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px;">${item.desc}</td>
          <td style="padding: 10px; text-align: right;">${formatCurrency(item.govCost)}</td>
        </tr>
      `;
      
      const itemVat = isQuotation ? 0 : item.proFee * 0.05;
      const itemTotal = item.proFee + itemVat;
      
      proRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px;">${item.desc}</td>
          <td style="padding: 10px; text-align: right;">${formatCurrency(item.proFee)}</td>
          <td style="padding: 10px; text-align: right;">${isQuotation ? 'N/A' : formatCurrency(itemVat)}</td>
          <td style="padding: 10px; text-align: right;">${formatCurrency(itemTotal)}</td>
        </tr>
      `;
    });

    content = `
      <!-- Table 1: Government Fees -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: ${ZYRA_DARK}; font-size: 15px; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Table 1: Government Clearance Pass-Throughs (0% VAT / Non-Taxable)</h3>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">* Direct government disbursement fees charged at actual cost with 0% markup.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: center; width: 50px;">Sl No</th>
              <th style="padding: 10px; text-align: left;">Government Entity & Service</th>
              <th style="padding: 10px; text-align: right; width: 150px;">Portal Fee (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${govRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal Government Fees:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; background-color: #f8fafc;">${formatCurrency(govCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Table 2: Professional Fees -->
      <div style="margin-bottom: 35px;">
        <h3 style="color: ${ZYRA_DARK}; font-size: 15px; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Table 2: Professional PRO & Agency Service Charges (Taxable)</h3>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">* Professional consultation, processing, and document clearance charges.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: center; width: 50px;">Sl No</th>
              <th style="padding: 10px; text-align: left;">Service Description</th>
              <th style="padding: 10px; text-align: right; width: 120px;">Fee (AED)</th>
              <th style="padding: 10px; text-align: right; width: 100px;">VAT (5%)</th>
              <th style="padding: 10px; text-align: right; width: 120px;">Total (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${proRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal Agency Fees + VAT:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; background-color: #f8fafc;">${formatCurrency(proFee + (isQuotation ? 0 : vatAmount))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Grand Total Calculation Strip -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 400px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <div style="padding: 15px; background-color: #f8fafc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #475569;">
              <span>Total Government Outflow:</span>
              <span>${formatCurrency(govCost)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; color: #475569;">
              <span>Total Professional & VAT:</span>
              <span>${formatCurrency(proFee + (isQuotation ? 0 : vatAmount))}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid ${ZYRA_BRONZE}; font-size: 18px; font-weight: 900; color: ${ZYRA_DARK};">
              <span>TOTAL PAYABLE:</span>
              <span>${formatCurrency(totalPayable)}</span>
            </div>
            ${!isQuotation ? `
              <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 13px; color: #475569;">
                <span>Amount Received:</span>
                <span>${formatCurrency(amountReceived)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 14px; font-weight: bold; color: ${outstandingBalance > 0 ? '#dc2626' : '#059669'};">
                <span>OUTSTANDING BALANCE:</span>
                <span>${formatCurrency(outstandingBalance)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div style="margin-top: auto; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 11px;">
        ${isQuotation 
          ? `<p><strong>Quotation validity:</strong> ${(data as QuotationData).expiry || '30 days from issuance'}. Government fees are billed strictly at official portal receipts.</p>
             ${(data as QuotationData).notes ? `<p>Notes: ${(data as QuotationData).notes}</p>` : ''}` 
          : `<p>Thank you for choosing Zyra Documents Clearance Services.</p><p>This is a system-generated official tax invoice.</p>`}
      </div>
    `;
  } else if (data.type === 'PAYMENT_RECEIPT') {
    const d = data as PaymentReceiptData;
    content = `
      <div style="max-width: 600px; margin: 20px auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <!-- Payment Breakdown Box -->
        <div style="background-color: #f8fafc; padding: 40px 30px; text-align: center; border-bottom: 1px solid #cbd5e1;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">Amount Received (AED)</p>
          <div style="font-size: 42px; font-weight: 900; color: ${ZYRA_BRONZE}; margin-bottom: 20px; line-height: 1;">
            ${formatCurrency(d.amount)}
          </div>
          <span style="display: inline-block; padding: 6px 16px; background-color: #10b981; color: white; font-size: 12px; font-weight: bold; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Payment Successful
          </span>
        </div>
        
        <div style="padding: 30px;">
          <table style="width: 100%; font-size: 14px; color: #334155; border-spacing: 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Payment Mode:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.method}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Transaction / Cheque Ref:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.transactionRef || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Linked Invoice Ref:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${d.invoiceRef || 'N/A'}</td>
            </tr>
            ${d.previousTotal !== undefined ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Previous Invoiced Total:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${formatCurrency(d.previousTotal)}</td>
            </tr>
            ` : ''}
            ${d.remainingBalance !== undefined ? `
            <tr>
              <td style="padding: 12px 0; color: #64748b;"><strong>Remaining Balance Due:</strong></td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; color: ${d.remainingBalance > 0 ? '#dc2626' : '#10b981'};">${formatCurrency(Math.max(0, d.remainingBalance))}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>
      
      <!-- Verification Footer -->
      <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="width: 150px; height: 150px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 11px; text-transform: uppercase; font-weight: bold; transform: rotate(-15deg);">
            Official Stamp
          </div>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">Verified by: Accounts Department</p>
          <p style="margin: 5px 0 0 0;">Thank you for choosing Zyra Documents Clearance Services.</p>
        </div>
      </div>
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
          line-height: 1.5;
          color: #334155;
          margin: 0;
          padding: 40px;
          background-color: white;
          max-width: 800px;
          margin: 0 auto;
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
        @media print {
          .action-bar {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            padding: 0;
            margin: 0;
            max-width: none;
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
      ${header}
      ${content}
    </body>
    </html>
  `;
}

export function printDocument(data: PrintData) {
  const html = generateHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Please allow popups to print documents.');
  }
}
