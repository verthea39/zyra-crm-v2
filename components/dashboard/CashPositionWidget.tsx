import { Wallet, Landmark, PiggyBank } from "lucide-react";

const formatMoney = (minorUnits: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2 }).format(minorUnits / 100);

export function CashPositionWidget({
  cashInHandMinor,
  bankCardMinor,
}: {
  cashInHandMinor: number;
  bankCardMinor: number;
}) {
  const totalMinor = cashInHandMinor + bankCardMinor;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cash in Hand</p>
          <p className="text-base font-bold text-foreground truncate">{formatMoney(cashInHandMinor)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Landmark className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank / Card Balance</p>
          <p className="text-base font-bold text-foreground truncate">{formatMoney(bankCardMinor)}</p>
        </div>
      </div>

      <div className="bg-[#FDF8F0] border border-[#EADBC8] rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#EADBC8] text-[#98682E] flex items-center justify-center shrink-0">
          <PiggyBank className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98682E]">Total Liquid Funds</p>
          <p className="text-base font-bold text-[#7D5321] truncate">{formatMoney(totalMinor)}</p>
        </div>
      </div>
    </div>
  );
}
