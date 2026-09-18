import prisma from "@/lib/prisma";
import { MetricTiles } from "@/components/finance/MetricTiles";
import { LedgerView } from "@/components/finance/LedgerView";
import { PinLockGuard } from "@/components/finance/PinLockGuard";
import { CashPositionWidget } from "@/components/dashboard/CashPositionWidget";
import { PortalWalletsSection } from "@/components/wallets/PortalWalletsSection";
import { getWalletStats } from "@/app/actions/wallets";

export const dynamic = "force-dynamic";

export default async function FinanceCockpitPage() {
  // Fetch all transactions, newest first. `date` alone ties for seeded/bulk
  // rows sharing the same timestamp (e.g. INV-2026-001-A/B/C), leaving
  // Postgres to break ties in an unspecified order -- `createdAt` as a
  // secondary key guarantees the most recently created record wins ties.
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  // Calculate metrics
  let revenue = 0;
  let directCosts = 0; // supplierCostPart across all income -- gov/supplier fees paid out per invoice
  let operatingExpenses = 0;
  let receivables = 0;
  let payables = 0;
  let grossProfit = 0;

  for (const tx of transactions) {
    const balance = tx.amountTotal - tx.amountPaid;

    if (tx.type === "INCOME") {
      revenue += tx.amountTotal;
      directCosts += tx.supplierCostPart;
      // Gross profit = customer rate minus real supplier/govt cost, derived
      // rather than stored so it can never drift out of sync with the tx.
      grossProfit += tx.amountTotal - tx.supplierCostPart;
      if (balance > 0) receivables += balance;
    } else if (tx.type === "EXPENSE") {
      operatingExpenses += tx.amountTotal;
      if (balance > 0) payables += balance;
    }
  }

  // Total Expenses = direct supplier/govt costs passed through on every
  // invoice + standalone operational expense entries -- not just the
  // EXPENSE-type transactions, which miss the cost of goods/services sold.
  const expenses = directCosts + operatingExpenses;
  const netProfit = revenue - expenses;

  const metrics = {
    revenue,
    expenses,
    netProfit,
    receivables,
    payables,
    grossProfit
  };

  const clients = await prisma.client.findMany({
    include: {
      transactions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const clientCount = clients.length;

  const [allPayments, allExpenses, incomeTransactions, wallets] = await Promise.all([
    prisma.transactionPayment.findMany({ select: { transactionId: true, amountMinor: true, method: true } }),
    prisma.transaction.findMany({ where: { type: 'EXPENSE' }, select: { amountTotal: true, paymentMode: true } }),
    prisma.transaction.findMany({ where: { type: 'INCOME' }, select: { id: true, amountPaid: true, paymentMode: true } }),
    getWalletStats(),
  ]);

  const isCashMethod = (method: string | null | undefined) => (method || "").toLowerCase().includes("cash");
  let cashInHandMinor =
    allPayments.filter((p) => isCashMethod(p.method)).reduce((sum, p) => sum + p.amountMinor, 0) -
    allExpenses.filter((tx) => isCashMethod(tx.paymentMode)).reduce((sum, tx) => sum + tx.amountTotal, 0);
  let bankCardMinor =
    allPayments.filter((p) => !isCashMethod(p.method)).reduce((sum, p) => sum + p.amountMinor, 0) -
    allExpenses.filter((tx) => !isCashMethod(tx.paymentMode)).reduce((sum, tx) => sum + tx.amountTotal, 0);

  // Some invoices (bulk-imported records, or ones paid via the legacy
  // createIncome flow) carry amountPaid directly on the Transaction with no
  // TransactionPayment rows at all -- without this, their collected cash
  // never shows up in Liquid Funds despite the invoice being marked PAID.
  const txIdsWithPaymentRows = new Set(allPayments.map((p) => p.transactionId));
  for (const tx of incomeTransactions) {
    if (tx.amountPaid <= 0 || txIdsWithPaymentRows.has(tx.id)) continue;
    if (isCashMethod(tx.paymentMode)) cashInHandMinor += tx.amountPaid;
    else bankCardMinor += tx.amountPaid;
  }

  return (
    <PinLockGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <MetricTiles metrics={metrics} />
          <PortalWalletsSection wallets={wallets} />
          <CashPositionWidget cashInHandMinor={cashInHandMinor} bankCardMinor={bankCardMinor} />
          <LedgerView
            transactions={transactions} 
            clients={clients}
            totalTransactions={transactions.length}
            totalClients={clientCount}
          />
        </div>
      </div>
    </PinLockGuard>
  );
}
