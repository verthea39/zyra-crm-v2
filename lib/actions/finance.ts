"use server";

import { z } from "zod";
import { TxnDirection, TxnStatus, PaymentDirection, PaymentMode } from "@prisma/client";
import svc, { serialize, BadRequest, NotFound } from "../services/finance.service";
import { revalidatePath } from "next/cache";
import { requirePermission, UnauthorizedError, ForbiddenError } from "@/lib/session";

// ------------------------------------------------------------------ schemas

const money = z.number().positive().max(10_000_000, "Amount looks wrong. Check the decimal point.");

const transactionSchema = z.object({
  direction: z.nativeEnum(TxnDirection),
  occurredAt: z.coerce.date(),
  categoryId: z.string().min(1, "Pick a category"),
  clientId: z.string().nullish(),
  caseFileId: z.string().nullish(),
  amountAed: money,
  taxAed: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
  vendorName: z.string().max(200).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
});

const createTransactionWithPaymentSchema = transactionSchema.extend({
  paidAmountAed: z.number().min(0).optional(),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  accountId: z.string().optional(),
});

const paymentSchema = z.object({
  direction: z.nativeEnum(PaymentDirection),
  occurredAt: z.coerce.date(),
  mode: z.nativeEnum(PaymentMode),
  accountId: z.string().min(1, "Pick an account"),
  clientId: z.string().nullish(),
  amountAed: money,
  chequeNo: z.string().max(50).optional(),
  chequeDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
  allocations: z
    .array(z.object({ transactionId: z.string(), amountAed: money }))
    .optional(),
});

const reasonSchema = z.object({
  reason: z.string().min(3, "Say why. This goes in the audit log."),
});

// ------------------------------------------------------------------ helpers

/** 
 * Wraps service calls with Zod validation and structured error handling 
 * for Server Actions. 
 */
async function handleAction<T>(actionFn: () => Promise<T>): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await actionFn();
    return { success: true, data: serialize(data) };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Check the highlighted fields: " + error.issues.map(i => i.message).join(", ") };
    }
    if (error instanceof BadRequest || error instanceof NotFound) {
      return { success: false, error: error.message };
    }
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return { success: false, error: error.message };
    }
    if (error?.code === "P2002") {
      return { success: false, error: "That reference already exists." };
    }
    if (error?.code === "P2003") {
      return { success: false, error: "Linked client, case or category no longer exists." };
    }
    console.error("[finance action error]", error);
    return { success: false, error: "Something went wrong saving this. Nothing was changed." };
  }
}

// ------------------------------------------------------------------ actions

export async function listTransactionsAction(filters: any) {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.listTransactions(filters);
  });
}

export async function listPaymentsAction(filters: any) {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.listPayments(filters);
  });
}

export async function createTransactionAction(data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const parsed = createTransactionWithPaymentSchema.parse(data);
    const txn = await svc.createTransaction(parsed, session.user.id);
    
    if (parsed.paidAmountAed && parsed.paidAmountAed > 0) {
      if (!parsed.paymentMode || !parsed.accountId) {
        throw new BadRequest("Payment mode and account are required when recording a paid amount.");
      }
      
      await svc.recordPayment({
        direction: parsed.direction === "INCOME" ? "IN" : "OUT",
        occurredAt: parsed.occurredAt,
        mode: parsed.paymentMode,
        accountId: parsed.accountId,
        clientId: parsed.clientId,
        amountAed: parsed.paidAmountAed,
        notes: `Initial payment for ${txn.reference}`,
        allocations: [{ transactionId: txn.id, amountAed: parsed.paidAmountAed }]
      }, session.user.id);
    }

    revalidatePath("/finance");
    return txn;
  });
}

export async function updateTransactionAction(id: string, data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const parsed = transactionSchema.partial().parse(data);
    const txn = await svc.updateTransaction(id, parsed, session.user.id);
    revalidatePath("/finance");
    return txn;
  });
}

export async function voidTransactionAction(id: string, data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const { reason } = reasonSchema.parse(data);
    const txn = await svc.voidTransaction(id, reason, session.user.id);
    revalidatePath("/finance");
    return txn;
  });
}

export async function deleteTransactionAction(id: string, data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const { reason } = reasonSchema.parse(data);
    const txn = await svc.deleteTransaction(id, reason, session.user.id);
    revalidatePath("/finance");
    return txn;
  });
}

export async function recordPaymentAction(data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const parsed = paymentSchema.parse(data);
    const payment = await svc.recordPayment(parsed, session.user.id);
    revalidatePath("/finance");
    return payment;
  });
}

export async function updatePaymentAction(id: string, data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const parsed = paymentSchema.partial().parse(data);
    const payment = await svc.updatePayment(id, parsed, session.user.id);
    revalidatePath("/finance");
    return payment;
  });
}

export async function reversePaymentAction(id: string, data: any) {
  return handleAction(async () => {
    const session = await requirePermission("invoices:write");
    const { reason } = reasonSchema.parse(data);
    const payment = await svc.reversePayment(id, reason, session.user.id);
    revalidatePath("/finance");
    return payment;
  });
}

export async function getSummaryAction(from: Date, to: Date) {
  return handleAction(async () => {
    await requirePermission("financials:view");
    return svc.getSummary(from, to);
  });
}

export async function getMonthlyTrendAction(from: Date, to: Date) {
  return handleAction(async () => {
    await requirePermission("financials:view");
    return svc.getMonthlyTrend(from, to);
  });
}

export async function getReceivablesAction(limit: number = 100) {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.getReceivables({ limit });
  });
}

export async function getClientBalanceAction(clientId: string) {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.getClientBalance(clientId);
  });
}

export async function getCaseMarginAction(caseId: string) {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.getCaseMargin(caseId);
  });
}

export async function getReferenceDataAction() {
  return handleAction(async () => {
    await requirePermission("invoices:read");
    return svc.getReferenceData();
  });
}
