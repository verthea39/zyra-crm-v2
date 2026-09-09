import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

// AED amounts arrive as floats (e.g. 19.99); `* 100` can land on 1998.9999999999998,
// which BigInt() rejects outright. Round to the nearest fils before converting.
function aedToFils(amountAed: number): bigint {
  return BigInt(Math.round(amountAed * 100));
}

// Convert BigInts to Strings for JSON serialization
export function serialize(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Recomputes Transaction status based on allocations
async function recomputeTransaction(tx: Prisma.TransactionClient, transactionId: string) {
  const transaction = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { allocations: true },
  });

  if (!transaction) return;

  const settledFils = transaction.allocations.reduce((sum, a) => sum + a.amountFils, BigInt(0));
  const grossFils = transaction.amountFils + transaction.taxFils;

  let status = transaction.status;
  if (status !== "VOID") {
    if (settledFils >= grossFils) {
      status = "PAID";
    } else if (settledFils > 0) {
      status = "PARTIAL";
    } else {
      status = "UNPAID";
    }
  }

  await tx.transaction.update({
    where: { id: transactionId },
    data: { settledFils, status },
  });
}

export async function createTransaction(data: any, userId?: string) {
  if (data.direction === "INCOME" && !data.clientId) {
    throw new BadRequest("Income transactions must have a client.");
  }

  const category = await db.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new BadRequest("Category not found");
  if (category.direction !== data.direction) {
    throw new BadRequest(`Category direction (${category.direction}) does not match transaction direction (${data.direction})`);
  }

  // Generate sequence reference
  const count = await db.transaction.count();
  const ref = `${data.direction === "INCOME" ? "INV" : "EXP"}-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;

  const { amountAed, taxAed, paidAmountAed, paymentMode, accountId, ...transactionData } = data;

  return db.$transaction(async (tx) => {
    const txn = await tx.transaction.create({
      data: {
        ...transactionData,
        reference: ref,
        amountFils: aedToFils(amountAed),
        taxFils: taxAed ? aedToFils(taxAed) : BigInt(0),
        createdById: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "Transaction",
        entityId: txn.id,
        action: "CREATE",
        after: serialize(txn),
        userId,
      },
    });

    return txn;
  });
}

export async function updateTransaction(id: string, data: any, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({ where: { id } });
    if (!existing) throw new NotFound("Transaction not found");

    if (data.amountAed !== undefined) {
      const newAmountFils = aedToFils(data.amountAed);
      const newTaxFils = data.taxAed !== undefined ? aedToFils(data.taxAed) : existing.taxFils;
      
      if (existing.settledFils > newAmountFils + newTaxFils) {
        throw new BadRequest(`Amount cannot be less than the ${(Number(existing.settledFils)/100).toFixed(2)} AED already collected. Remove the payment allocation first.`);
      }
    }

    const { amountAed, taxAed, ...transactionData } = data;

    const updated = await tx.transaction.update({
      where: { id },
      data: {
        ...transactionData,
        amountFils: amountAed !== undefined ? aedToFils(amountAed) : undefined,
        taxFils: taxAed !== undefined ? aedToFils(taxAed) : undefined,
      },
    });

    await recomputeTransaction(tx, id);

    await tx.auditLog.create({
      data: {
        entity: "Transaction",
        entityId: id,
        action: "UPDATE",
        before: serialize(existing),
        after: serialize(updated),
        userId,
      },
    });

    return tx.transaction.findUnique({ where: { id } });
  });
}

export async function voidTransaction(id: string, reason: string, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({ where: { id }, include: { allocations: true } });
    if (!existing) throw new NotFound("Transaction not found");

    if (existing.allocations.length > 0) {
      throw new BadRequest("Cannot void a transaction that has been partially or fully paid. Remove payments first.");
    }

    const updated = await tx.transaction.update({
      where: { id },
      data: { status: "VOID", voidReason: reason },
    });

    await tx.auditLog.create({
      data: {
        entity: "Transaction",
        entityId: id,
        action: "VOID",
        before: serialize(existing),
        after: serialize(updated),
        reason,
        userId,
      },
    });

    return updated;
  });
}

export async function deleteTransaction(id: string, reason: string, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({ where: { id }, include: { allocations: true } });
    if (!existing) throw new NotFound("Transaction not found");

    if (existing.allocations.length > 0) {
      throw new BadRequest("Cannot delete a transaction that has been paid. Remove payments first.");
    }

    const updated = await tx.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        entity: "Transaction",
        entityId: id,
        action: "DELETE",
        before: serialize(existing),
        after: serialize(updated),
        reason,
        userId,
      },
    });

    return updated;
  });
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
        amountFils,
        unappliedFils: amountFils, // Will be reduced by allocations
        chequeNo: data.chequeNo,
        chequeDate: data.chequeDate,
        notes: data.notes,
        createdById: userId,
      },
    });

    let allocations = data.allocations || [];

    // Auto-allocate oldest open invoices if allocations omitted and client provided
    if (allocations.length === 0 && data.clientId && data.direction === "IN") {
      const openTxns = await tx.transaction.findMany({
        where: {
          clientId: data.clientId,
          direction: "INCOME",
          status: { in: ["UNPAID", "PARTIAL"] },
          deletedAt: null,
        },
        orderBy: { occurredAt: "asc" },
      });

      let remaining = amountFils;
      for (const txn of openTxns) {
        if (remaining <= BigInt(0)) break;
        const due = (txn.amountFils + txn.taxFils) - txn.settledFils;
        if (due > BigInt(0)) {
          const allocateFils = remaining >= due ? due : remaining;
          allocations.push({ transactionId: txn.id, amountAed: Number(allocateFils) / 100 });
          remaining -= allocateFils;
        }
      }
    }

    let unappliedFils = amountFils;
    for (const alloc of allocations) {
      const allocFils = aedToFils(alloc.amountAed);
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          transactionId: alloc.transactionId,
          amountFils: allocFils,
        },
      });
      unappliedFils -= allocFils;
      await recomputeTransaction(tx, alloc.transactionId);
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { unappliedFils },
      include: { allocations: true },
    });

    await tx.auditLog.create({
      data: {
        entity: "Payment",
        entityId: payment.id,
        action: "CREATE",
        after: serialize(updatedPayment),
        userId,
      },
    });

    return updatedPayment;
  });
}

export async function reversePayment(id: string, reason: string, userId?: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { id },
      include: { allocations: true },
    });
    if (!existing) throw new NotFound("Payment not found");

    const txnIds = existing.allocations.map(a => a.transactionId);

    await tx.paymentAllocation.deleteMany({
      where: { paymentId: id },
    });

    for (const txnId of txnIds) {
      await recomputeTransaction(tx, txnId);
    }

    const updated = await tx.payment.update({
      where: { id },
      data: { deletedAt: new Date(), unappliedFils: existing.amountFils },
    });

    await tx.auditLog.create({
      data: {
        entity: "Payment",
        entityId: id,
        action: "REVERSE",
        before: serialize(existing),
        after: serialize(updated),
        reason,
        userId,
      },
    });

    return updated;
  });
}

export async function listTransactions(filters: any) {
  const where: any = { deletedAt: null };

  if (filters.direction) where.direction = filters.direction;
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.caseFileId) where.caseFileId = filters.caseFileId;
  
  if (filters.from || filters.to) {
    where.occurredAt = {};
    if (filters.from) where.occurredAt.gte = filters.from;
    if (filters.to) where.occurredAt.lte = filters.to;
  }
  
  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { vendorName: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  
  if (filters.tag) {
    where.tags = { has: filters.tag };
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;

  const data = await db.transaction.findMany({
    where,
    include: { client: true, category: true },
    orderBy: { [filters.sortBy || "occurredAt"]: filters.sortDir || "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await db.transaction.count({ where });

  return { data, meta: { total, page, pageSize } };
}

export async function listPayments(filters: any) {
  const where: any = { deletedAt: null };

  if (filters.direction) where.direction = filters.direction;
  if (filters.mode) where.mode = filters.mode;
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.clientId) where.clientId = filters.clientId;
  
  if (filters.from || filters.to) {
    where.occurredAt = {};
    if (filters.from) where.occurredAt.gte = filters.from;
    if (filters.to) where.occurredAt.lte = filters.to;
  }
  
  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
      { chequeNo: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;

  const data = await db.payment.findMany({
    where,
    include: { client: true, account: true },
    orderBy: { [filters.sortBy || "occurredAt"]: filters.sortDir || "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await db.payment.count({ where });

  return { data, meta: { total, page, pageSize } };
}

// Analytics via Views
export async function getClientBalance(clientId: string) {
  const result = await db.$queryRaw`SELECT * FROM "client_balance" WHERE "clientId" = ${clientId}`;
  return (result as any[])[0] || null;
}

export async function getCaseMargin(caseId: string) {
  const result = await db.$queryRaw`SELECT * FROM "case_margin" WHERE "caseFileId" = ${caseId}`;
  return (result as any[])[0] || null;
}

export async function getReceivables(opts: { limit: number }) {
  const result = await db.$queryRaw`
    SELECT 
      r.*, 
      COALESCE(cp."companyNameEn", ip."fullNameEn", 'Unknown Client') as name,
      COALESCE(u.phone, 'N/A') as phone
    FROM "receivables_ageing" r
    JOIN "Client" c ON r."clientId" = c.id
    LEFT JOIN "CorporateProfile" cp ON cp."clientId" = c.id
    LEFT JOIN "IndividualProfile" ip ON ip."clientId" = c.id
    LEFT JOIN "User" u ON u."clientId" = c.id
    ORDER BY (r."bucket_0_30" + r."bucket_31_60" + r."bucket_61_90" + r."bucket_90_plus") DESC
    LIMIT ${opts.limit}
  `;
  return result;
}

export async function getSummary(from: Date, to: Date) {
  const txns = await db.transaction.findMany({
    where: { occurredAt: { gte: from, lte: to }, deletedAt: null, status: { not: "VOID" } },
    include: { category: true }
  });

  const payments = await db.payment.findMany({
    where: { occurredAt: { gte: from, lte: to }, deletedAt: null }
  });

  let revenueFils = BigInt(0);
  let expenseFils = BigInt(0);
  let govCostFils = BigInt(0);

  txns.forEach(t => {
    if (t.direction === "INCOME") revenueFils += t.amountFils;
    if (t.direction === "EXPENSE") {
      expenseFils += t.amountFils;
      if (t.category.isGovernmentFee) govCostFils += t.amountFils;
    }
  });

  let cashInFils = BigInt(0);
  let cashOutFils = BigInt(0);

  payments.forEach(p => {
    if (p.direction === "IN") cashInFils += p.amountFils;
    if (p.direction === "OUT") cashOutFils += p.amountFils;
  });

  // Outstanding Due computation (this doesn't follow date range per UI rules)
  const dueResult = await db.$queryRaw`
    SELECT SUM("dueFils") as "totalDue" FROM "client_balance"
  `;
  
  // Outstanding Payable computation
  const payableResult = await db.$queryRaw`
    SELECT SUM("amountFils" + "taxFils" - "settledFils") as "totalPayable" 
    FROM "Transaction" 
    WHERE "direction" = 'EXPENSE' AND "status" IN ('UNPAID', 'PARTIAL') AND "deletedAt" IS NULL
  `;

  // Cash in hand (all accounts)
  const cashResult = await db.$queryRaw`
    SELECT SUM("currentBalanceFils") as "totalCash" FROM "account_balance"
  `;

  return {
    revenueFils,
    expenseFils,
    govCostFils,
    netFils: revenueFils - expenseFils,
    cashInFils,
    cashOutFils,
    outstandingDueFils: (dueResult as any)[0]?.totalDue || BigInt(0),
    outstandingPayableFils: (payableResult as any)[0]?.totalPayable || BigInt(0),
    cashInHandFils: (cashResult as any)[0]?.totalCash || BigInt(0),
    entryCount: txns.length + payments.length,
  };
}

export async function getDailySummary(date: Date) {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return getSummary(from, to);
}

export async function getLifetimeSummary() {
  return getSummary(new Date(2000, 0, 1), new Date(2999, 11, 31));
}

export async function getMonthlyTrend(from: Date, to: Date) {
  // Use the monthly PL function we defined in SQL
  const diffMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  const result = await db.$queryRaw`SELECT * FROM get_monthly_pl(${diffMonths})`;
  return result;
}

export async function getReferenceData() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
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

  // Map clients to a simple { id, name } structure for the frontend
  const mappedClients = clients.map(c => ({
    id: c.id,
    name: c.clientType === 'CORPORATE' 
      ? c.corporateProfile?.companyNameEn || 'Unknown Corporate Client'
      : c.individualProfile?.fullNameEn || 'Unknown Individual Client'
  }));

  const accounts = await db.account.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true }
  });

  return { categories, clients: mappedClients, accounts };
}

const svc = {
  createTransaction,
  updateTransaction,
  voidTransaction,
  deleteTransaction,
  recordPayment,
  reversePayment,
  listTransactions,
  listPayments,
  getClientBalance,
  getCaseMargin,
  getReceivables,
  getSummary,
  getDailySummary,
  getLifetimeSummary,
  getMonthlyTrend,
  getReferenceData,
};

export default svc;
