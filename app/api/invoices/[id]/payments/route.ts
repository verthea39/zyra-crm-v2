import { NextResponse } from 'next/server';
import { z } from 'zod';
import svc from '@/lib/services/finance.service';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';

// Allowed payment methods based on Prisma PaymentMode enum
const PaymentModeEnum = z.enum(["CASH", "CARD", "BANK_TRANSFER", "PORTAL_BALANCE", "CHEQUE"]);

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: PaymentModeEnum,
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  accountId: z.string().optional(), // Optional, we will fallback if missing
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 1. Validate payload
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { amount, payment_method, reference_number, notes, accountId: providedAccountId } = parsed.data;

    // 2. Fetch the invoice to check balance
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "VOID") {
      return NextResponse.json({ error: "Cannot pay a voided invoice" }, { status: 400 });
    }

    // Amount is in AED, balance is in Fils
    const amountFils = BigInt(Math.round(amount * 100));
    
    if (amountFils > invoice.balanceDueMinor) {
      return NextResponse.json({ 
        error: `Amount exceeds current balance due (${Number(invoice.balanceDueMinor) / 100} AED). Overpayments are not supported in this route.` 
      }, { status: 400 });
    }

    // 3. Resolve Account ID
    let accountId = providedAccountId;
    if (!accountId) {
      // Find the first active bank/cash account
      const defaultAccount = await db.account.findFirst({
        where: { isActive: true, type: { in: ["CASH", "BANK"] } }
      });
      if (!defaultAccount) {
         return NextResponse.json({ error: "No active financial account found to deposit into." }, { status: 500 });
      }
      accountId = defaultAccount.id;
    }

    // 4. Record Payment via Service (which wraps it in a db.$transaction)
    const payment = await svc.recordPayment({
      direction: "IN",
      occurredAt: new Date(),
      mode: payment_method,
      accountId: accountId,
      clientId: invoice.clientId,
      amountAed: amount,
      chequeNo: reference_number,
      notes: notes,
      allocations: [{ transactionId: invoice.id, amountAed: amount }]
    }, session.user.id);

    // 5. Fetch updated invoice to return
    const updatedInvoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        totalPayableMinor: true,
        paidAmountMinor: true,
        balanceDueMinor: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: amount,
        payment_method,
        paid_at: payment.occurredAt
      },
      invoice: {
        id: updatedInvoice?.id,
        status: updatedInvoice?.status,
        total_amount: Number(updatedInvoice?.totalPayableMinor) / 100,
        paid_amount: Number(updatedInvoice?.paidAmountMinor) / 100,
        balance_due: Number(updatedInvoice?.balanceDueMinor) / 100,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("[POST /api/invoices/[id]/payments]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
