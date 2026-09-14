import prisma from "@/lib/prisma";
import { MetricTiles } from "@/components/finance/MetricTiles";
import { LedgerView } from "@/components/finance/LedgerView";
import { PinLockGuard } from "@/components/finance/PinLockGuard";

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

  return (
    <PinLockGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <MetricTiles metrics={metrics} />
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
