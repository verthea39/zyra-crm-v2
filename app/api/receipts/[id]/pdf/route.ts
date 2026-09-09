import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import ReceiptDocument from "@/lib/pdf/ReceiptDocument";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { LOGO_BASE64 } from "@/lib/pdf/logoBase64";
import React from "react";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    
    const payment = await db.payment.findUnique({
      where: { id: params.id },
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

    const amountStr = (Number(payment.amountFils) / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 });

    const stream = await renderToStream(
      React.createElement(ReceiptDocument, {
        logoUrl: LOGO_BASE64,
        receiptNumber: payment.reference,
        paymentDate: format(new Date(payment.occurredAt), "dd MMM yyyy"),
        clientName: clientName || "Valued Client",
        amount: amountStr,
        paymentMode: payment.mode.replace("_", " "),
        chequeNo: payment.chequeNo || undefined,
        notes: payment.notes || undefined,
        companyName: "Zyra Business Hub",
        companyTrn: "100000000000003",
        companyAddress: "Dubai, United Arab Emirates"
      }) as any
    );

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.reference}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
