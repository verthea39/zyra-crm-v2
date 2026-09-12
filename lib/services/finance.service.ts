import { db } from "@/lib/db";
import { Prisma, PaymentDirection } from "@prisma/client";

export class BadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequest";
  }
}

export class NotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFound";
  }
}

function aedToFils(amountAed: number): bigint {
  return BigInt(Math.round(amountAed * 100));
}

export function serialize(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

async function recomputeInvoice(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { paymentAllocations: true },
  });
  if (!invoice) return;
  const settledFils = invoice.paymentAllocations.reduce((sum, a) => sum + a.amountMinor, BigInt(0));
  const grossFils = invoice.totalPayableMinor;
  let status = invoice.status;
  if (status !== "VOID") {
    if (settledFils >= grossFils) status = "PAID";
    else if (settledFils > 0) status = "PARTIAL";
    else status = "UNPAID";
  }
  await tx.invoice.update({
    where: { id: invoiceId },
    data: { paidAmountMinor: settledFils, balanceDueMinor: grossFils - settledFils, status },
  });
}

async function recomputeExpense(tx: Prisma.TransactionClient, expenseId: string) {
  const expense = await tx.expense.findUnique({
    where: { id: expenseId },
    include: { paymentAllocations: true },
  });
  if (!expense) return;
  const settledFils = expense.paymentAllocations.reduce((sum, a) => sum + a.amountMinor, BigInt(0));
  const grossFils = expense.totalMinor;
  let status = expense.status;
  if (status !== "VOID") {
    if (settledFils >= grossFils) status = "PAID";
    else if (settledFils > 0) status = "PARTIAL";
    else status = "UNPAID";
  }
  await tx.expense.update({
    where: { id: expenseId },
    data: { paidMinor: settledFils, balanceDueMinor: grossFils - settledFils, status },
  });
}

export async function createTransaction(data: any, userId?: string) {
  if (data.direction === "INCOME" && !data.clientId) {
    throw new BadRequest("Income transactions must have a client.");
  }
  const { amountAed, taxAed, paidAmountAed, paymentMode, accountId, ...transactionData } = data;
  const amountMinor = aedToFils(amountAed);
  const taxMinor = taxAed ? aedToFils(taxAed) : BigInt(0);
  const totalMinor = amountMinor + taxMinor;

  return db.$transaction(async (tx) => {
    if (data.direction === "INCOME") {
      const count = await tx.invoice.count();
      const ref = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: ref,
          clientId: data.clientId,
          issueDate: data.occurredAt,
          supplyDate: data.occurredAt,
          supplierTrn: "TBA",
          customerTrn: "TBA",
          subtotalServiceFeesMinor: amountMinor,
          vatAmountMinor: taxMinor,
          subtotalGovDisbursementsMinor: BigInt(0),
          totalPayableMinor: totalMinor,
          balanceDueMinor: totalMinor,
          status: "UNPAID",
          createdById: userId,
          lineItems: {
            create: [{
              description: data.description || "Service",
              type: "Service",
              quantity: 1,
              unitPriceMinor: amountMinor,
              vatRate: taxMinor > 0 ? 5 : 0,
              lineTotalMinor: totalMinor
            }]
          }
        },
      });
      return { ...invoice, id: invoice.id, reference: invoice.invoiceNumber, direction: "INCOME", amountFils: totalMinor };
    } else {
      const count = await tx.expense.count();
      const ref = `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
      const expense = await tx.expense.create({
        data: {
          reference: ref,
          vendorName: data.vendorName || "Vendor",
          description: data.description,
          amountMinor: amountMinor,
          taxMinor: taxMinor,
          totalMinor: totalMinor,
          balanceDueMinor: totalMinor,
          status: "UNPAID",
          occurredAt: data.occurredAt,
          createdById: userId,
        },
      });
      return { ...expense, id: expense.id, reference: expense.reference, direction: "EXPENSE", amountFils: totalMinor };
    }
  });
}

export async function updateTransaction(id: string, data: any, userId?: string) {
  return db.$transaction(async (tx) => {
    const isInvoice = await tx.invoice.findUnique({ where: { id } });
    if (isInvoice) {
      const { amountAed, taxAed, ...rest } = data;
      const amountMinor = amountAed !== undefined ? aedToFils(amountAed) : undefined;
      const taxMinor = taxAed !== undefined ? aedToFils(taxAed) : undefined;
      let totalMinor = undefined;
      if (amountMinor !== undefined || taxMinor !== undefined) {
          totalMinor = (amountMinor !== undefined ? amountMinor : isInvoice.subtotalServiceFeesMinor) +
                       (taxMinor !== undefined ? taxMinor : isInvoice.vatAmountMinor);
          if (isInvoice.paidAmountMinor > totalMinor) {
             throw new BadRequest(`Amount cannot be less than collected.`);
          }
      }
      const updated = await tx.invoice.update({
        where: { id },
        data: {
           subtotalServiceFeesMinor: amountMinor,
           vatAmountMinor: taxMinor,
           totalPayableMinor: totalMinor,
           issueDate: data.occurredAt,
           supplyDate: data.occurredAt,
           clientId: data.clientId,
        }
      });
      await recomputeInvoice(tx as Prisma.TransactionClient, id);
      return { ...updated, reference: updated.invoiceNumber, direction: "INCOME" };
    } else {
      const isExpense = await tx.expense.findUnique({ where: { id } });
      if (!isExpense) throw new NotFound("Transaction not found");

      const { amountAed, taxAed, ...rest } = data;
      const amountMinor = amountAed !== undefined ? aedToFils(amountAed) : undefined;
      const taxMinor = taxAed !== undefined ? aedToFils(taxAed) : undefined;
      let totalMinor = undefined;
      if (amountMinor !== undefined || taxMinor !== undefined) {
          totalMinor = (amountMinor !== undefined ? amountMinor : isExpense.amountMinor) +
                       (taxMinor !== undefined ? taxMinor : isExpense.taxMinor);
          if (isExpense.paidMinor > totalMinor) {
             const allocs = await tx.paymentAllocation.findMany({ where: { expenseId: id }, include: { payment: { include: { allocations: true } } } });
             if (allocs.length === 0) {
                 // Seed data with no real payments, let it pass (recomputeExpense will reset paidMinor to 0)
             } else if (allocs.length === 1 && allocs[0].payment.allocations.length === 1) {
                 await tx.paymentAllocation.update({ where: { id: allocs[0].id }, data: { amountMinor: totalMinor } });
                 await tx.payment.update({ where: { id: allocs[0].paymentId }, data: { amountMinor: totalMinor, unappliedMinor: 0n } });
             } else {
                 throw new BadRequest(`Amount cannot be less than paid. Please adjust the payments first.`);
             }
          }
      }
      const updated = await tx.expense.update({
        where: { id },
        data: {
           amountMinor: amountMinor,
           taxMinor: taxMinor,
           totalMinor: totalMinor,
           occurredAt: data.occurredAt,
           vendorName: data.vendorName,
           description: data.description
        }
      });
      await recomputeExpense(tx as Prisma.TransactionClient, id);
      return { ...updated, reference: updated.reference, direction: "EXPENSE" };
    }
  });
}

export async function voidTransaction(id: string, reason: string, userId?: string) {
  return db.$transaction(async (tx) => {
    const isInvoice = await tx.invoice.findUnique({ where: { id }, include: { paymentAllocations: true } });
    if (isInvoice) {
      if (isInvoice.paymentAllocations.length > 0) throw new BadRequest("Cannot void paid invoice");
      const updated = await tx.invoice.update({ where: { id }, data: { status: "VOID" } });
      return { ...updated, direction: "INCOME" };
    } else {
      const isExpense = await tx.expense.findUnique({ where: { id }, include: { paymentAllocations: true } });
      if (!isExpense) throw new NotFound("Transaction not found");
      if (isExpense.paymentAllocations.length > 0) throw new BadRequest("Cannot void paid expense");
      const updated = await tx.expense.update({ where: { id }, data: { status: "VOID" } });
      return { ...updated, direction: "EXPENSE" };
    }
  });
}

export async function deleteTransaction(id: string, reason: string, userId?: string) {
  // we do not have deletedAt on Expense / Invoice in new schema
  // so we will just void it for now
  return voidTransaction(id, reason, userId);
}

export async function recordPayment(data: any, userId?: string) {
  return db.$transaction(async (tx) => {
    const count = await tx.payment.count();
    const ref = `RCT-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
    const amountFils = aedToFils(data.amountAed);

    const payment = await tx.payment.create({
      data: {
        reference: ref,
        direction: data.direction,
        occurredAt: data.occurredAt,
        mode: data.mode,
        accountId: data.accountId,
        clientId: data.clientId,
        amountMinor: amountFils,
        unappliedMinor: amountFils,
        chequeNo: data.chequeNo,
        chequeDate: data.chequeDate,
        notes: data.notes,
        createdById: userId,
      },
    });

    let allocations = data.allocations || [];
    let unappliedFils = amountFils;

    for (const alloc of allocations) {
      const allocFils = aedToFils(alloc.amountAed);
      const isInvoice = await tx.invoice.findUnique({ where: { id: alloc.transactionId } });
      
      if (isInvoice) {
        await tx.paymentAllocation.create({
          data: { paymentId: payment.id, invoiceId: alloc.transactionId, amountMinor: allocFils },
        });
        unappliedFils -= allocFils;
        await recomputeInvoice(tx as Prisma.TransactionClient, alloc.transactionId);
      } else {
        await tx.paymentAllocation.create({
          data: { paymentId: payment.id, expenseId: alloc.transactionId, amountMinor: allocFils },
        });
        unappliedFils -= allocFils;
        await recomputeExpense(tx as Prisma.TransactionClient, alloc.transactionId);
      }
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { unappliedMinor: unappliedFils },
      include: { allocations: true },
    });
    return updatedPayment;
  });
}

export async function updatePayment(id: string, data: any, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { id }, include: { allocations: true } });
    if (!existing) throw new NotFound("Payment not found");
    const allocatedAmount = existing.amountMinor - existing.unappliedMinor;
    let newUnappliedFils = existing.unappliedMinor;
    let newAmountFils = existing.amountMinor;

    if (data.amountAed !== undefined) {
      newAmountFils = aedToFils(data.amountAed);
      if (newAmountFils < allocatedAmount) throw new BadRequest(`Amount cannot be less than allocated.`);
      newUnappliedFils = newAmountFils - allocatedAmount;
    }

    const { amountAed, ...paymentData } = data;
    if ('allocations' in paymentData) delete paymentData.allocations;
    if ('direction' in paymentData) delete paymentData.direction;

    return tx.payment.update({
      where: { id },
      data: { ...paymentData, amountMinor: newAmountFils, unappliedMinor: newUnappliedFils },
      include: { allocations: true },
    });
  });
}

export async function reversePayment(id: string, reason: string, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { id }, include: { allocations: true } });
    if (!existing) throw new NotFound("Payment not found");

    const invoiceIds = existing.allocations.filter(a => a.invoiceId).map(a => a.invoiceId as string);
    const expenseIds = existing.allocations.filter(a => a.expenseId).map(a => a.expenseId as string);

    await tx.paymentAllocation.deleteMany({ where: { paymentId: id } });

    for (const invId of invoiceIds) await recomputeInvoice(tx as Prisma.TransactionClient, invId);
    for (const expId of expenseIds) await recomputeExpense(tx as Prisma.TransactionClient, expId);

    return tx.payment.update({
      where: { id },
      data: { deletedAt: new Date(), unappliedMinor: existing.amountMinor },
    });
  });
}

export async function listTransactions(filters: any) {
  let invoices = await db.invoice.findMany({
    include: { client: { include: { corporateProfile: true, individualProfile: true } } },
    orderBy: { issueDate: "desc" },
  });
  let expenses = await db.expense.findMany({
    orderBy: { occurredAt: "desc" },
  });

  let data = [
    ...invoices.map(i => ({
      id: i.id,
      occurredAt: i.issueDate,
      reference: i.invoiceNumber,
      direction: "INCOME",
      client: i.client ? {
        ...i.client,
        name: i.client.clientType === 'CORPORATE' 
          ? i.client.corporateProfile?.companyNameEn || 'Unknown Corporate Client'
          : i.client.individualProfile?.fullNameEn || 'Unknown Individual Client'
      } : null,
      amountFils: i.subtotalServiceFeesMinor || i.totalPayableMinor,
      taxFils: i.vatAmountMinor || 0n,
      settledFils: i.paidAmountMinor || 0n,
      status: i.status
    })),
    ...expenses.map(e => ({
      id: e.id,
      occurredAt: e.occurredAt,
      reference: e.reference,
      direction: "EXPENSE",
      client: null,
      vendorName: e.vendorName,
      amountFils: (e.totalMinor || 0n) - (e.taxMinor || 0n),
      taxFils: e.taxMinor || 0n,
      settledFils: e.paidMinor || 0n,
      status: e.status
    }))
  ];

  data.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return { data, meta: { total: data.length, page: 1, pageSize: 1000 } };
}

export async function listPayments(filters: any) {
  const where: any = { deletedAt: null };
  const rawData = await db.payment.findMany({
    where,
    include: { client: { include: { corporateProfile: true, individualProfile: true } }, account: true },
    orderBy: { occurredAt: "desc" },
  });
  const data = rawData.map(payment => ({
    ...payment,
    client: payment.client ? {
      ...payment.client,
      name: payment.client.clientType === 'CORPORATE' ? payment.client.corporateProfile?.companyNameEn : payment.client.individualProfile?.fullNameEn
    } : null,
    amountFils: payment.amountMinor,
    unappliedFils: payment.unappliedMinor
  }));
  return { data, meta: { total: data.length, page: 1, pageSize: 1000 } };
}

export async function getClientBalance(clientId: string) { return null; }
export async function getCaseMargin(caseId: string) { return null; }

export async function getReceivables(opts: { limit: number }) {
  const invoices = await db.invoice.findMany({
    where: { balanceDueMinor: { gt: 0 } },
    include: { client: { include: { corporateProfile: true, individualProfile: true } } }
  });

  const now = new Date();
  const clientsMap: any = {};
  
  for (const inv of invoices) {
    const days = Math.floor((now.getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (!clientsMap[inv.clientId]) {
       const clientName = inv.client.clientType === 'CORPORATE' ? inv.client.corporateProfile?.companyNameEn : inv.client.individualProfile?.fullNameEn;
       clientsMap[inv.clientId] = { clientId: inv.clientId, name: clientName, bucket_0_30: 0n, bucket_31_60: 0n, bucket_61_90: 0n, bucket_90_plus: 0n };
    }
    const bal = inv.balanceDueMinor;
    if (days <= 30) clientsMap[inv.clientId].bucket_0_30 += bal;
    else if (days <= 60) clientsMap[inv.clientId].bucket_31_60 += bal;
    else if (days <= 90) clientsMap[inv.clientId].bucket_61_90 += bal;
    else clientsMap[inv.clientId].bucket_90_plus += bal;
  }
  return Object.values(clientsMap).slice(0, opts.limit);
}

export async function getSummary(from: Date, to: Date) {
  const invoices = await db.invoice.findMany({ where: { issueDate: { gte: from, lte: to }, status: { not: "VOID" } } });
  const expenses = await db.expense.findMany({ where: { occurredAt: { gte: from, lte: to }, status: { not: "VOID" } } });
  const payments = await db.payment.findMany({ where: { occurredAt: { gte: from, lte: to }, deletedAt: null } });

  let revenueFils = BigInt(0);
  let expenseFils = BigInt(0);
  let outstandingDueFils = BigInt(0);
  let outstandingPayableFils = BigInt(0);

  invoices.forEach(i => { revenueFils += i.totalPayableMinor; outstandingDueFils += i.balanceDueMinor; });
  expenses.forEach(e => { expenseFils += e.totalMinor; outstandingPayableFils += e.balanceDueMinor; });

  let cashInFils = BigInt(0);
  let cashOutFils = BigInt(0);
  payments.forEach(p => {
    if (p.direction === "IN") cashInFils += p.amountMinor;
    if (p.direction === "OUT") cashOutFils += p.amountMinor;
  });

  return {
    revenueFils,
    expenseFils,
    govCostFils: BigInt(0),
    netFils: revenueFils - expenseFils,
    cashInFils,
    cashOutFils,
    outstandingDueFils,
    outstandingPayableFils,
    cashInHandFils: BigInt(0),
    entryCount: invoices.length + expenses.length + payments.length,
  };
}

export async function getDailySummary(date: Date) {
  const from = new Date(date); from.setHours(0, 0, 0, 0);
  const to = new Date(date); to.setHours(23, 59, 59, 999);
  return getSummary(from, to);
}

export async function getLifetimeSummary() {
  return getSummary(new Date(2000, 0, 1), new Date(2999, 11, 31));
}

export async function getMonthlyTrend(from: Date, to: Date) {
  return [];
}

export async function getReferenceData() {
  const accounts = await db.account.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true }
  });

  const clients = await db.client.findMany({
    where: { accountStatus: { not: 'INACTIVE' } },
    select: {
      id: true,
      clientType: true,
      corporateProfile: { select: { companyNameEn: true } },
      individualProfile: { select: { fullNameEn: true } }
    }
  });

  const mappedClients = clients.map(c => ({
    id: c.id,
    name: c.clientType === 'CORPORATE' 
      ? c.corporateProfile?.companyNameEn || 'Unknown Corporate Client'
      : c.individualProfile?.fullNameEn || 'Unknown Individual Client'
  }));

  const categories = accounts.filter(a => ["INCOME", "EXPENSE"].includes(a.type)).map(a => ({
    id: a.id,
    name: a.name,
    direction: a.type,
    isGovernmentFee: false
  }));

  return { categories, clients: mappedClients, accounts };
}

const svc = {
  createTransaction, updateTransaction, voidTransaction, deleteTransaction,
  recordPayment, updatePayment, reversePayment,
  listTransactions, listPayments, getClientBalance, getCaseMargin, getReceivables,
  getSummary, getDailySummary, getLifetimeSummary, getMonthlyTrend, getReferenceData,
};

export default svc;
