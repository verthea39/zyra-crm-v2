import { PinLockGuard } from "@/components/finance/PinLockGuard";
import { ReportsHub } from "@/components/finance/reports/ReportsHub";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <PinLockGuard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Reports & Business Intelligence
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">Reports Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Profit, cash flow, wallets, daily closing, and invoice analytics.</p>
          </div>
          <ReportsHub />
        </div>
      </div>
    </PinLockGuard>
  );
}
