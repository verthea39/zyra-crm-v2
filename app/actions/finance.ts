"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeTransactionStatus } from "@/lib/calculations";
import { logActivity } from "@/lib/activity";
import { logServerError } from "@/lib/logger";
import { z } from "zod";

export async function createIncome(data: any) {
  try {
    const govFee = Math.round(data.govFees * 100);
    const serviceFee = Math.round(data.serviceFee * 100);
    const amountTotal = govFee + serviceFee;
    const amountPaid = Math.round(data.amountPaid * 100);
    const status = computeTransactionStatus(amountTotal, amountPaid, data.dueDate);

    // Auto-generate reference INV-{Year}-{Random or Sequence}
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'INCOME' }});
    const reference = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    // Link to client if a match is found
    const client = await prisma.client.findFirst({
      where: { name: { equals: data.clientName, mode: 'insensitive' } }
    });

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "INCOME",
        counterparty: data.clientName,
        category: data.category,
        paymentMode: data.paymentMode,
        amountTotal,
        amountPaid,
        status: status as any,
        date: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
        isCaseInvoice: true, // As per rule, we assume this adds to dual-bucket
        govFeePart: govFee,
        serviceFeePart: serviceFee,
        supplierCostPart: govFee,
        clientId: client?.id,
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx };
  } catch (error) {
    console.error("Error creating income:", error);
    return { success: false, error: "Failed to create income transaction." };
  }
}

export async function createInvoice(data: any) {
  try {
    const govFee = Math.round(data.govCost * 100);
    const serviceFee = Math.round(data.proFee * 100);
    const vatAmount = Math.round(data.vatAmount * 100);
    const amountTotal = govFee + serviceFee + vatAmount;
    const amountPaid = 0; // Invoices are generated unpaid initially

    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'INCOME' }});
    const reference = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "INCOME",
        counterparty: data.clientName,
        category: "Invoice Generation",
        paymentMode: "Pending",
        amountTotal,
        amountPaid,
        status: "PENDING",
        date: new Date(),
        description: data.caseRef ? `Case Ref: ${data.caseRef}` : 'Auto-generated invoice',
        isCaseInvoice: true,
        govFeePart: govFee,
        serviceFeePart: serviceFee,
        clientId: data.clientId || null,
        lineItems: data.lineItems
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx, reference };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: "Failed to create invoice." };
  }
}

export async function createExpense(data: any) {
  try {
    const amountTotal = Math.round(data.amount * 100);
    const amountPaid = Math.round(data.amountPaid * 100);
    const status = computeTransactionStatus(amountTotal, amountPaid, data.dueDate);

    // Auto-generate reference EXP-{Year}-{Random or Sequence}
    const year = new Date().getFullYear();
    const count = await prisma.transaction.count({ where: { type: 'EXPENSE' }});
    const reference = `EXP-${year}-${String(count + 1).padStart(3, '0')}`;

    const tx = await prisma.transaction.create({
      data: {
        reference,
        type: "EXPENSE",
        counterparty: data.vendor,
        category: data.category,
        paymentMode: data.paymentMode,
        amountTotal,
        amountPaid,
        status: status as any,
        date: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        description: data.description,
      }
    });

    revalidatePath("/finance/cockpit");
    return { success: true, tx };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense transaction." };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const paymentCount = await tx.transactionPayment.count({ where: { transactionId: id } });
      if (paymentCount > 0) {
        throw new Error("HAS_PAYMENTS");
      }
      await tx.transaction.delete({ where: { id } });
    });
    revalidatePath("/finance/cockpit");
    return { success: true, result };
  } catch (error: any) {
    if (error?.message === "HAS_PAYMENTS") {
      return {
        success: false,
        error: "Cannot delete -- this invoice already has recorded payment receipts. Cancel it instead to preserve the payment audit trail.",
      };
    }
    logServerError(error, { action: "deleteTransaction", extra: { transactionId: id } });
    return { success: false, error: "Failed to delete transaction." };
  }
}

export async function getPendingInvoices(clientId: string) {
  try {
    const invoices = await prisma.transaction.findMany({
      where: {
        clientId,
        type: "INCOME",
        status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] },
      },
      select: {
        id: true,
        reference: true,
        amountTotal: true,
        amountPaid: true,
      },
      orderBy: { date: "desc" },
    });
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export type RecordPaymentInput = {
  transactionId: string;
  amount: number; // AED, display units -- converted to minor units here
  method?: string;
  transactionRef?: string;
  notes?: string;
};

const recordPaymentSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  amount: z.number().positive("Payment amount must be greater than zero").finite(),
  method: z.string().max(100).optional(),
  transactionRef: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Records one partial-or-full payment against an existing invoice/expense.
 * Multiple payments can be recorded against the same transaction over time
 * (Payment #1: 50% advance, Payment #2: final settlement, etc) -- each one
 * gets its own TransactionPayment row so a receipt can be reprinted for it
 * individually, while Transaction.amountPaid/status stay the running total.
 */
export async function recordPayment(input: RecordPaymentInput) {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid payment payload" };
  }

  try {
    const amountMinor = Math.round(parsed.data.amount * 100);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id: parsed.data.transactionId } });
      if (!transaction) throw new Error("NOT_FOUND");

      const remainingBalance = transaction.amountTotal - transaction.amountPaid;
      if (amountMinor > remainingBalance) throw new Error("EXCEEDS_BALANCE");

      const payment = await tx.transactionPayment.create({
        data: {
          transactionId: parsed.data.transactionId,
          amountMinor,
          method: parsed.data.method,
          transactionRef: parsed.data.transactionRef,
          notes: parsed.data.notes,
        },
      });

      const newAmountPaid = transaction.amountPaid + amountMinor;
      const newStatus = computeTransactionStatus(transaction.amountTotal, newAmountPaid, transaction.dueDate);

      const updated = await tx.transaction.update({
        where: { id: parsed.data.transactionId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      });

      return { payment, transaction: updated };
    });

    revalidatePath("/finance/cockpit");
    revalidatePath("/dashboard");

    await logActivity({
      action: "PAYMENT_RECORDED",
      title: `Payment of AED ${(amountMinor / 100).toFixed(2)} recorded against ${result.transaction.reference}`,
      details: {
        transactionId: parsed.data.transactionId,
        amountMinor,
        method: parsed.data.method,
        remainingBalance: result.transaction.amountTotal - result.transaction.amountPaid,
      },
      entityType: "PAYMENT",
      entityId: result.payment.id,
    });

    return {
      success: true,
      payment: result.payment,
      transaction: result.transaction,
      remainingBalance: result.transaction.amountTotal - result.transaction.amountPaid,
    };
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return { success: false, error: "Invoice not found." };
    }
    if (error?.message === "EXCEEDS_BALANCE") {
      return { success: false, error: "Payment amount exceeds the remaining balance due." };
    }
    logServerError(error, { action: "recordPayment", extra: { transactionId: parsed.data.transactionId } });
    return { success: false, error: "Failed to record payment." };
  }
}

export async function getPaymentHistory(transactionId: string) {
  try {
    return await prisma.transactionPayment.findMany({
      where: { transactionId },
      orderBy: { paidAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return [];
  }
}

export async function getTransaction(transactionId: string) {
  try {
    return await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        payments: { orderBy: { paidAt: "desc" } },
        client: true,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

/**
 * Deletes one payment receipt immediately (with its own confirmation dialog
 * in the UI, separate from the main "Save Changes" flow since it's
 * destructive) and recomputes the parent transaction's amountPaid/status in
 * the same Prisma transaction so they never drift out of sync.
 */
export async function deleteTransactionPayment(paymentId: string) {
  try {
    const tx = await prisma.$transaction(async (trx) => {
      const payment = await trx.transactionPayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new Error("NOT_FOUND");

      await trx.transactionPayment.delete({ where: { id: paymentId } });

      const transaction = await trx.transaction.findUniqueOrThrow({ where: { id: payment.transactionId } });
      const remaining = await trx.transactionPayment.aggregate({
        where: { transactionId: payment.transactionId },
        _sum: { amountMinor: true },
      });
      const amountPaid = remaining._sum.amountMinor || 0;
      const status = computeTransactionStatus(transaction.amountTotal, amountPaid, transaction.dueDate);

      return trx.transaction.update({
        where: { id: payment.transactionId },
        data: { amountPaid, status },
      });
    });

    revalidatePath("/finance/cockpit");
    revalidatePath(`/finance/transactions/${tx.id}`);
    return { success: true, tx };
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return { success: false, error: "Payment not found." };
    }
    logServerError(error, { action: "deleteTransactionPayment", extra: { paymentId } });
    return { success: false, error: "Failed to delete payment." };
  }
}

export type PaymentEditInput = {
  id: string;
  amount: number; // AED, display units
  method: string;
  paidAt: string; // yyyy-mm-dd
  deleted?: boolean; // true -> remove this payment entirely
};

export type UpdateTransactionInput = {
  category: string;
  paymentMode?: string;
  description?: string;
  dueDate?: string;
  lineItems: { desc: string; govCost: number; proFee: number }[];
  // Edits/deletes to existing TransactionPayment rows -- no new payments are
  // created here, that's what Add Credit / Record Payment is for.
  payments?: PaymentEditInput[];
  // Flat paid-amount override, AED display units. Only applied when there
  // are no TransactionPayment rows to derive amountPaid from instead (bulk
  // imports, legacy invoices with no itemized payment history).
  amountPaid?: number;
};

export async function updateTransaction(id: string, data: UpdateTransactionInput) {
  try {
    const govFee = Math.round(data.lineItems.reduce((sum, i) => sum + i.govCost, 0) * 100);
    const serviceFee = Math.round(data.lineItems.reduce((sum, i) => sum + i.proFee, 0) * 100);
    const amountTotal = govFee + serviceFee;
    const newDueDate = data.dueDate ? new Date(data.dueDate) : null;

    const tx = await prisma.$transaction(async (trx) => {
      const existing = await trx.transaction.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND");

      let amountPaid = existing.amountPaid;

      if (data.payments && data.payments.length > 0) {
        for (const p of data.payments) {
          if (p.deleted) {
            await trx.transactionPayment.delete({ where: { id: p.id } });
          } else {
            await trx.transactionPayment.update({
              where: { id: p.id },
              data: {
                amountMinor: Math.round(p.amount * 100),
                method: p.method,
                paidAt: new Date(p.paidAt),
              },
            });
          }
        }
        // Recompute amountPaid from the edited/remaining payments rather
        // than trusting the client's arithmetic.
        const remaining = await trx.transactionPayment.aggregate({
          where: { transactionId: id },
          _sum: { amountMinor: true },
        });
        amountPaid = remaining._sum.amountMinor || 0;
      } else if (existing.type === "EXPENSE") {
        // Expenses are recorded fully paid at entry time and have no
        // TransactionPayment rows to aggregate -- keep them fully paid even
        // when the amount is corrected here, instead of falling through to
        // an empty aggregate and wiping the paid amount to zero.
        amountPaid = amountTotal;
      } else if (typeof data.amountPaid === "number") {
        amountPaid = Math.round(data.amountPaid * 100);
      }

      const status = computeTransactionStatus(amountTotal, amountPaid, newDueDate ?? existing.dueDate);

      return trx.transaction.update({
        where: { id },
        data: {
          category: data.category,
          paymentMode: data.paymentMode,
          description: data.description,
          dueDate: newDueDate,
          amountTotal,
          amountPaid,
          govFeePart: govFee,
          serviceFeePart: serviceFee,
          // Keep the internal cost basis in sync with the edited line items.
          supplierCostPart: govFee,
          lineItems: data.lineItems,
          status,
        },
      });
    });

    revalidatePath("/finance/cockpit");
    revalidatePath(`/finance/transactions/${id}`);
    return { success: true, tx };
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return { success: false, error: "Transaction not found." };
    }
    console.error("Error updating transaction:", error);
    return { success: false, error: "Failed to update transaction." };
  }
}
