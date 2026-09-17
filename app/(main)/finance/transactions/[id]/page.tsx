import { notFound } from "next/navigation";
import { getTransaction } from "@/app/actions/finance";
import prisma from "@/lib/prisma";
import { logServerError } from "@/lib/logger";
import { TransactionDetail } from "@/components/finance/TransactionDetail";
import { PinLockGuard } from "@/components/finance/PinLockGuard";

export const dynamic = "force-dynamic";

async function getClients() {
  try {
    return await prisma.client.findMany({ orderBy: { name: "asc" } });
  } catch (err) {
    logServerError(err, { action: "finance/transactions/[id]:getClients" });
    return [];
  }
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await getTransaction(id);
  if (!transaction) notFound();

  const clients = await getClients();

  return (
    <PinLockGuard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <TransactionDetail transaction={transaction as any} clients={clients} />
        </div>
      </div>
    </PinLockGuard>
  );
}
