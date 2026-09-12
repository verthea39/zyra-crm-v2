import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { LOGO_BASE64 } from "@/lib/pdf/logoBase64";
import React from "react";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const txn = await db.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        client: {
          include: {
            corporateProfile: true,
            individualProfile: true,
          }
        }
      }
    });

    if (!txn) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isCorp = txn.client?.clientType === "CORPORATE";
    const clientName = isCorp 
      ? txn.client?.corporateProfile?.companyNameEn 
      : txn.client?.individualProfile?.fullNameEn;
    const clientTrn = isCorp ? txn.client?.corporateProfile?.vatTrn : null;
    const clientPhone = isCorp 
      ? txn.client?.corporateProfile?.authorizedSignatoryMobile 
      : txn.client?.individualProfile?.passportNumber;

    const amountStr = (Number(txn.subtotalServiceFeesMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const taxStr = (Number(txn.vatAmountMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const settledStr = (Number(txn.paidAmountMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const billedStr = (Number(txn.totalPayableMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const balanceStr = (Number(txn.balanceDueMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const govStr = (Number(txn.subtotalGovDisbursementsMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lineItems = txn.lineItems.map(li => ({
      description: li.description,
      type: li.type,
      quantity: li.quantity.toString(),
      unitPrice: (Number(li.unitPriceMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: li.vatRate.toString(),
      lineTotal: (Number(li.unitPriceMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Before VAT
    }));

    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument
        logoUrl={LOGO_BASE64}
        invoiceNumber={txn.invoiceNumber}
        issueDate={format(new Date(txn.issueDate), "dd MMM yyyy")}
        supplyDate={format(new Date(txn.supplyDate), "dd MMM yyyy")}
        currency={txn.currency}
        supplierName={"Zyra Documents Clearance Services"}
        supplierAddress={"Burj Nahar Mall - Al Muteena, Deira, Dubai"}
        supplierPhone={"+971 4 123 4567"}
        supplierEmail={"info@zyradocs.com"}
        supplierWeb={"www.zyradocs.com"}
        supplierTrn={txn.supplierTrn}
        customerName={clientName || "Cash Customer"}
        customerTrn={txn.customerTrn || clientTrn || null}
        customerContact={clientPhone || undefined}
        lineItems={lineItems}
        subtotalServiceFees={amountStr}
        vatAmount={taxStr}
        subtotalGovDisbursements={govStr}
        totalPayable={billedStr}
        paidAmount={settledStr}
        balanceDue={balanceStr}
        qrDataUrl={""}
      />
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${txn.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
