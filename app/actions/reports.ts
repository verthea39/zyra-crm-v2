"use server";

import prisma from "@/lib/prisma";

export type ReportRange = { from: string; to: string }; // ISO yyyy-mm-dd, inclusive on both ends

function rangeBounds({ from, to }: ReportRange) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  return { start, end };
}

const isCashMethod = (m: string | null | undefined) => (m || "").toLowerCase().includes("cash");
const isCardMethod = (m: string | null | undefined) => (m || "").toLowerCase().includes("card");

// ---------------------------------------------------------------------------
// 1. Profit Report -- service-wise breakdown, aggregated from each income
// transaction's lineItems (govCost = supplier cost, proFee = margin, so
// govCost + proFee is the customer-facing rate for that line).
// ---------------------------------------------------------------------------
export type ProfitReportRow = {
  service: string;
  volume: number;
  revenue: number; // minor units
  supplierCost: number; // minor units
  netProfit: number; // minor units
  marginPct: number;
};

export async function getProfitReport(range: ReportRange) {
  const { start, end } = rangeBounds(range);

  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      where: { type: "INCOME", date: { gte: start, lte: end } },
      select: { amountTotal: true, supplierCostPart: true, lineItems: true, category: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amountTotal: true, supplierCostPart: true },
    }),
  ]);

  const byService = new Map<string, ProfitReportRow>();
  for (const tx of transactions) {
    const items = Array.isArray(tx.lineItems) ? (tx.lineItems as any[]) : [];
    if (items.length > 0) {
      for (const item of items) {
        const service = item.desc || "Unspecified Service";
        const revenue = Math.round((Number(item.govCost || 0) + Number(item.proFee || 0)) * 100);
        const supplierCost = Math.round(Number(item.govCost || 0) * 100);
        const row = byService.get(service) || { service, volume: 0, revenue: 0, supplierCost: 0, netProfit: 0, marginPct: 0 };
        row.volume += 1;
        row.revenue += revenue;
        row.supplierCost += supplierCost;
        byService.set(service, row);
      }
    } else {
      // No structured line items on this transaction -- fall back to its
      // category so the revenue/cost still shows up in the breakdown.
      const service = tx.category || "Uncategorized";
      const row = byService.get(service) || { service, volume: 0, revenue: 0, supplierCost: 0, netProfit: 0, marginPct: 0 };
      row.volume += 1;
      row.revenue += tx.amountTotal;
      row.supplierCost += tx.supplierCostPart;
      byService.set(service, row);
    }
  }

  const rows = Array.from(byService.values())
    .map((r) => {
      r.netProfit = r.revenue - r.supplierCost;
      r.marginPct = r.revenue > 0 ? (r.netProfit / r.revenue) * 100 : 0;
      return r;
    })
    .sort((a, b) => b.revenue - a.revenue);

  const grossRevenue = totals._sum.amountTotal || 0;
  const totalDirectCosts = totals._sum.supplierCostPart || 0;
  const netMargin = grossRevenue - totalDirectCosts;
  const avgMarginPct = grossRevenue > 0 ? (netMargin / grossRevenue) * 100 : 0;

  return { rows, summary: { grossRevenue, totalDirectCosts, netMargin, avgMarginPct } };
}

// ---------------------------------------------------------------------------
// 2. Cash Book -- opening balance, sequential cash movements for one day,
// running balance, closing balance. "Cash" = payment method/mode containing
// "cash" (same convention the cockpit's cash-position widget uses).
// ---------------------------------------------------------------------------
export type CashBookEntry = {
  id: string;
  time: Date;
  reference: string;
  description: string;
  direction: "INFLOW" | "OUTFLOW";
  amount: number; // minor units
  runningBalance: number; // minor units
};

export async function getCashBook(date: string) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const [priorPayments, priorExpenses, todayPayments, todayExpenses] = await Promise.all([
    prisma.transactionPayment.findMany({
      where: { paidAt: { lt: dayStart }, method: { contains: "cash", mode: "insensitive" } },
      select: { amountMinor: true },
    }),
    prisma.transaction.findMany({
      where: { type: "EXPENSE", date: { lt: dayStart }, paymentMode: { contains: "cash", mode: "insensitive" } },
      select: { amountTotal: true },
    }),
    prisma.transactionPayment.findMany({
      where: { paidAt: { gte: dayStart, lte: dayEnd }, method: { contains: "cash", mode: "insensitive" } },
      include: { transaction: { select: { reference: true, counterparty: true } } },
      orderBy: { paidAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { type: "EXPENSE", date: { gte: dayStart, lte: dayEnd }, paymentMode: { contains: "cash", mode: "insensitive" } },
      orderBy: { date: "asc" },
    }),
  ]);

  const openingBalance =
    priorPayments.reduce((s, p) => s + p.amountMinor, 0) - priorExpenses.reduce((s, e) => s + e.amountTotal, 0);

  const movements = [
    ...todayPayments.map((p) => ({
      id: p.id,
      time: p.paidAt,
      reference: p.transaction.reference,
      description: `Payment received -- ${p.transaction.counterparty}`,
      direction: "INFLOW" as const,
      amount: p.amountMinor,
    })),
    ...todayExpenses.map((e) => ({
      id: e.id,
      time: e.date,
      reference: e.reference,
      description: `${e.category} -- ${e.counterparty}`,
      direction: "OUTFLOW" as const,
      amount: e.amountTotal,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  let running = openingBalance;
  const entries: CashBookEntry[] = movements.map((m) => {
    running += m.direction === "INFLOW" ? m.amount : -m.amount;
    return { ...m, runningBalance: running };
  });

  return { date, openingBalance, entries, closingBalance: running };
}

// ---------------------------------------------------------------------------
// 3. Wallet & Account Report -- balances per payment channel plus the
// government portal wallets' top-up/deduction log for the selected range.
// ---------------------------------------------------------------------------
export async function getWalletAccountReport(range: ReportRange) {
  const { start, end } = rangeBounds(range);

  const [allPayments, allExpenses, wallets] = await Promise.all([
    prisma.transactionPayment.findMany({ select: { amountMinor: true, method: true } }),
    prisma.transaction.findMany({ where: { type: "EXPENSE" }, select: { amountTotal: true, paymentMode: true } }),
    prisma.portalWallet.findMany({
      include: {
        transactions: {
          where: { date: { gte: start, lte: end } },
          include: { client: { select: { name: true } } },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { entityName: "asc" },
    }),
  ]);

  const cashDrawer =
    allPayments.filter((p) => isCashMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0) -
    allExpenses.filter((e) => isCashMethod(e.paymentMode)).reduce((s, e) => s + e.amountTotal, 0);

  const corporateCard =
    allPayments.filter((p) => isCardMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0) -
    allExpenses.filter((e) => isCardMethod(e.paymentMode)).reduce((s, e) => s + e.amountTotal, 0);

  const mainBankAccount =
    allPayments.filter((p) => !isCashMethod(p.method) && !isCardMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0) -
    allExpenses.filter((e) => !isCashMethod(e.paymentMode) && !isCardMethod(e.paymentMode)).reduce((s, e) => s + e.amountTotal, 0);

  const governmentPortals = wallets.reduce((s, w) => s + w.balance, 0); // AED, float (PortalWallet.balance is not minor units)

  return {
    channels: { cashDrawer, mainBankAccount, corporateCard, governmentPortals },
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.entityName,
      balance: w.balance,
      transactions: w.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        clientName: t.client?.name || null,
        caseRef: t.caseRef,
        description: t.description,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// 4. Daily Closing Report -- single-day, end-of-day snapshot.
// ---------------------------------------------------------------------------
const PORTAL_FEE_KEYWORDS = ["tasheel", "amer", "government portal", "government pass-through", "mohre", "gdrfa", "icp", "ded"];

export async function getDailyClosingReport(date: string) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const [payments, incomeToday, expensesToday] = await Promise.all([
    prisma.transactionPayment.findMany({
      where: { paidAt: { gte: dayStart, lte: dayEnd } },
      select: { amountMinor: true, method: true },
    }),
    prisma.transaction.findMany({
      where: { type: "INCOME", date: { gte: dayStart, lte: dayEnd } },
      select: { amountTotal: true, amountPaid: true },
    }),
    prisma.transaction.findMany({
      where: { type: "EXPENSE", date: { gte: dayStart, lte: dayEnd } },
      select: { amountTotal: true, category: true },
    }),
  ]);

  const collections = {
    cash: payments.filter((p) => isCashMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0),
    card: payments.filter((p) => isCardMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0),
    bank: payments.filter((p) => !isCashMethod(p.method) && !isCardMethod(p.method)).reduce((s, p) => s + p.amountMinor, 0),
  };
  const totalCollections = collections.cash + collections.card + collections.bank;

  const outstandingToday = incomeToday.reduce((s, t) => s + (t.amountTotal - t.amountPaid), 0);

  const totalExpensesToday = expensesToday.reduce((s, e) => s + e.amountTotal, 0);
  const supplierFeesDisbursed = expensesToday
    .filter((e) => PORTAL_FEE_KEYWORDS.some((kw) => e.category.toLowerCase().includes(kw)))
    .reduce((s, e) => s + e.amountTotal, 0);
  const officeExpenses = totalExpensesToday - supplierFeesDisbursed;

  const netCashPosition = totalCollections - totalExpensesToday;

  return {
    date,
    collections,
    totalCollections,
    outstandingToday,
    supplierFeesDisbursed,
    officeExpenses,
    netCashPosition,
  };
}

// ---------------------------------------------------------------------------
// 5. Invoice & Item-wise Report -- backed by the Document/DocumentItem model
// (the dedicated Invoice/Quotation/Draft system), not the ledger Transaction.
// ---------------------------------------------------------------------------
export type InvoiceCollectionFilter = "ALL" | "PAID" | "PARTIAL" | "PENDING";

// Document has no literal PARTIAL status (its status enum is
// DRAFT/SENT/PAID/OVERDUE/CANCELLED/CONVERTED) -- derive the collection
// bucket the same way the finance ledger does elsewhere, from paid vs total.
function collectionStatus(paidMinor: number, totalMinor: number): "PAID" | "PARTIAL" | "PENDING" {
  if (totalMinor > 0 && paidMinor >= totalMinor) return "PAID";
  if (paidMinor > 0) return "PARTIAL";
  return "PENDING";
}

export async function getInvoiceItemReport(range: ReportRange, filter: InvoiceCollectionFilter = "ALL") {
  const { start, end } = rangeBounds(range);

  const documents = await prisma.document.findMany({
    where: { issueDate: { gte: start, lte: end } },
    include: { items: true, client: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
  });

  const filtered = filter === "ALL"
    ? documents
    : documents.filter((d) => collectionStatus(d.paidMinor, d.totalMinor) === filter);

  const byItem = new Map<string, { service: string; qty: number; totalBilled: number; totalVat: number }>();
  for (const doc of filtered) {
    const vatableSubtotal = doc.items.filter((i) => !i.vatExempt).reduce((s, i) => s + i.lineTotalMinor, 0);
    for (const item of doc.items) {
      const row = byItem.get(item.description) || { service: item.description, qty: 0, totalBilled: 0, totalVat: 0 };
      row.qty += item.quantity;
      row.totalBilled += item.lineTotalMinor;
      // VAT is stored per-document, not per-item -- apportion it across
      // this document's vatable items in proportion to their line totals.
      if (!item.vatExempt && vatableSubtotal > 0) {
        row.totalVat += Math.round((item.lineTotalMinor / vatableSubtotal) * doc.vatMinor);
      }
      byItem.set(item.description, row);
    }
  }

  const items = Array.from(byItem.values())
    .map((r) => ({ ...r, avgRate: r.qty > 0 ? Math.round(r.totalBilled / r.qty) : 0 }))
    .sort((a, b) => b.totalBilled - a.totalBilled);

  const documentRows = filtered.map((d) => ({
    id: d.id,
    reference: d.reference,
    client: d.client?.name || "—",
    type: d.type,
    status: d.status,
    collectionStatus: collectionStatus(d.paidMinor, d.totalMinor),
    total: d.totalMinor,
    issueDate: d.issueDate,
  }));

  const summary = {
    totalRevenue: filtered.reduce((s, d) => s + d.totalMinor, 0),
    totalVat: filtered.reduce((s, d) => s + d.vatMinor, 0),
    count: filtered.length,
  };

  return { items, documents: documentRows, summary };
}
