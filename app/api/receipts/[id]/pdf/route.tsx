import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import ReceiptDocument from "@/lib/pdf/ReceiptDocument";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { LOGO_BASE64 } from "@/lib/pdf/logoBase64";
import React from "react";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            corporateProfile: true,
            individualProfile: true,
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const clientName = payment.client?.clientType === "CORPORATE" 
      ? payment.client.corporateProfile?.companyNameEn 
      : payment.client?.individualProfile?.fullNameEn;

    const amountStr = (Number(payment.amountMinor) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 });

    const pdfBuffer = await renderToBuffer(
      <ReceiptDocument
        logoUrl={LOGO_BASE64}
        receiptNumber={payment.reference}
        paymentDate={format(new Date(payment.occurredAt), "dd MMM yyyy")}
        clientName={clientName || "Valued Client"}
        amount={amountStr}
        paymentMode={payment.mode.replace("_", " ")}
        chequeNo={payment.chequeNo || undefined}
        notes={payment.notes || undefined}
        companyName={"Zyra Business Hub"}
        companyTrn={"100000000000003"}
        companyAddress={"Dubai, United Arab Emirates"}
      />
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
