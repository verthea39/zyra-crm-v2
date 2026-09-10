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
    
    const txn = await db.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        client: {
          include: {
            corporateProfile: true,
            individualProfile: true,
          }
        }
      }
    });

    if (!txn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isCorp = txn.client?.clientType === "CORPORATE";
    const clientName = isCorp 
      ? txn.client?.corporateProfile?.companyNameEn 
      : txn.client?.individualProfile?.fullNameEn;
    const clientTrn = isCorp ? txn.client?.corporateProfile?.vatTrn : null;
    const clientPhone = isCorp 
      ? txn.client?.corporateProfile?.authorizedSignatoryMobile 
      : txn.client?.individualProfile?.passportNumber; // fallback or could add phone for individuals

    const amountNum = Number(txn.amountFils) / 100;
    const taxNum = Number(txn.taxFils) / 100;
    const settledNum = Number(txn.settledFils) / 100;
    const billedNum = amountNum + taxNum;
    const balanceNum = billedNum - settledNum;

    const amountStr = amountNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const taxStr = taxNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const settledStr = settledNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const billedStr = billedNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const balanceStr = balanceNum.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const isGov = txn.category?.isGovernmentFee;

    const lineItems = [{
      description: txn.description || txn.category?.name || "Service",
      type: isGov ? "GOVERNMENT_CHARGE" : "AGENCY_SERVICE_FEE",
      quantity: "1",
      unitPrice: amountStr,
      vatRate: isGov ? "0" : "5",
      lineTotal: amountStr, // Line total before VAT, matching the table columns
    }];

    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument
        logoUrl={LOGO_BASE64}
        invoiceNumber={txn.reference}
        issueDate={format(new Date(txn.occurredAt), "dd MMM yyyy")}
        supplyDate={format(new Date(txn.occurredAt), "dd MMM yyyy")}
        currency={"AED"}
        supplierName={"Zyra Documents Clearance Services"}
        supplierAddress={"Burj Nahar Mall - Al Muteena, Deira, Dubai"}
        supplierPhone={"+971 4 123 4567"}
        supplierEmail={"info@zyradocs.com"}
        supplierWeb={"www.zyradocs.com"}
        supplierTrn={"100000000000003"}
        customerName={clientName || "Cash Customer"}
        customerTrn={clientTrn || null}
        customerContact={clientPhone || undefined}
        lineItems={lineItems}
        subtotalServiceFees={isGov ? "0.00" : amountStr}
        vatAmount={taxStr}
        subtotalGovDisbursements={isGov ? amountStr : "0.00"}
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
        "Content-Disposition": `inline; filename="invoice-${txn.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
