import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getQuotation } from "@/lib/actions/quotations";
import { QuotationDocument, type QuotationPdfLineItem } from "@/lib/pdf/QuotationDocument";
import { formatDate } from "@/lib/utils";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { LOGO_BASE64 } from "@/lib/pdf/logoBase64";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const supplierName = "ZYRA Documents Clearance Services";
  const supplierAddress = "Burj Nahar Mall - Al Muteena, Deira, Dubai";
  const supplierPhone = "+971 54 782 4637 / +971 50 722 8583";
  const supplierEmail = "zyrabusinesshub@gmail.com";
  const supplierWeb = "zyrabusinesshub.com";

  const customerName =
    quotation.client.corporateProfile?.companyNameEn ??
    quotation.client.individualProfile?.fullNameEn ??
    "Client";
    
  const customerContact = quotation.client.corporateProfile?.authorizedSignatoryName ?? quotation.client.individualProfile?.fullNameEn ?? "";
  const customerPhone = quotation.client.corporateProfile?.authorizedSignatoryMobile ?? "";
  const customerEmail = quotation.client.corporateProfile?.authorizedSignatoryEmail ?? "";
  
  const customerTrn = 
    quotation.client.corporateProfile?.vatTrn ?? null;

  const lineItems: QuotationPdfLineItem[] = quotation.lineItems.map((li) => ({
    description: li.description,
    type: li.type,
    quantity: li.quantity.toString(),
    unitPrice: li.unitPrice.toString(),
    vatRate: li.type === "AGENCY_SERVICE_FEE" ? "5" : "0",
    lineTotal: (Number(li.quantity) * Number(li.unitPrice) * (li.type === "AGENCY_SERVICE_FEE" ? 1.05 : 1)).toString(),
    govReceiptRef: li.govReceiptRef,
  }));

  const logoUrl = LOGO_BASE64;
  
  const totals = calculateInvoiceTotals(quotation.lineItems.map(item => ({
    type: item.type,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  })));

  const pdfBuffer = await renderToBuffer(
    <QuotationDocument
      logoUrl={logoUrl}
      quotationNumber={quotation.reference}
      issueDate={formatDate(quotation.createdAt)}
      currency="AED"
      supplierName={supplierName}
      supplierAddress={supplierAddress}
      supplierPhone={supplierPhone}
      supplierEmail={supplierEmail}
      supplierWeb={supplierWeb}
      supplierTrn={process.env.COMPANY_TRN ?? "100000000000003"}
      customerName={customerName}
      customerTrn={customerTrn}
      customerContact={customerContact}
      customerPhone={customerPhone}
      customerEmail={customerEmail}
      lineItems={lineItems}
      subtotalServiceFees={totals.subtotalServiceFees.toString()}
      vatAmount={totals.vatAmount.toString()}
      subtotalGovDisbursements={totals.subtotalGovDisbursements.toString()}
      totalPayable={totals.totalPayable.toString()}
    />
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quotation.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
