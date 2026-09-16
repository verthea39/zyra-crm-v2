import prisma from "@/lib/prisma";
import { MetricTiles } from "@/components/finance/MetricTiles";
import { LedgerView } from "@/components/finance/LedgerView";
import { PinLockGuard } from "@/components/finance/PinLockGuard";
import { CashPositionWidget } from "@/components/dashboard/CashPositionWidget";
import { PortalWalletsSection } from "@/components/wallets/PortalWalletsSection";
import { getWalletStats } from "@/app/actions/wallets";

export const dynamic = "force-dynamic";

export default async function FinanceCockpitPage() {
  // Fetch all transactions, ordered by date descending
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
  });

  // Calculate metrics
  let revenue = 0;
  let expenses = 0;
  let receivables = 0;
  let payables = 0;

  for (const tx of transactions) {
    const balance = tx.amountTotal - tx.amountPaid;

    if (tx.type === "INCOME") {
      revenue += tx.amountTotal;
      if (balance > 0) receivables += balance;
    } else if (tx.type === "EXPENSE") {
      expenses += tx.amountTotal;
      if (balance > 0) payables += balance;
    }
  }

  const netProfit = revenue - expenses;

  const metrics = {
    revenue,
    expenses,
    netProfit,
    receivables,
    payables
  };

  const clients = await prisma.client.findMany({
    include: {
      transactions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const clientCount = clients.length;

  const [allPayments, allExpenses, wallets] = await Promise.all([
    prisma.transactionPayment.findMany({ select: { amountMinor: true, method: true } }),
    prisma.transaction.findMany({ where: { type: 'EXPENSE' }, select: { amountTotal: true, paymentMode: true } }),
    getWalletStats(),
  ]);

  const isCashMethod = (method: string | null | undefined) => (method || "").toLowerCase().includes("cash");
  const cashInHandMinor =
    allPayments.filter((p) => isCashMethod(p.method)).reduce((sum, p) => sum + p.amountMinor, 0) -
    allExpenses.filter((tx) => isCashMethod(tx.paymentMode)).reduce((sum, tx) => sum + tx.amountTotal, 0);
  const bankCardMinor =
    allPayments.filter((p) => !isCashMethod(p.method)).reduce((sum, p) => sum + p.amountMinor, 0) -
    allExpenses.filter((tx) => !isCashMethod(tx.paymentMode)).reduce((sum, tx) => sum + tx.amountTotal, 0);

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
