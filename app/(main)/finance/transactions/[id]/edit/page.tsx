import { notFound } from "next/navigation";
import { getTransaction } from "@/app/actions/finance";
import { TransactionEditForm } from "@/components/finance/TransactionEditForm";
import { PinLockGuard } from "@/components/finance/PinLockGuard";

export const dynamic = "force-dynamic";

export default async function TransactionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await getTransaction(id);
  if (!transaction) notFound();

  return (
    <PinLockGuard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <TransactionEditForm transaction={transaction as any} />
        </div>
      </div>
    </PinLockGuard>
  );
}
