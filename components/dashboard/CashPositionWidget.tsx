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
    <>
      {/* Mobile: one compact 3-column pill instead of 3 stacked cards */}
      <div className="md:hidden grid grid-cols-3 divide-x divide-slate-100 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="flex flex-col items-center gap-1 px-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">Cash in Hand</p>
          <p className="text-sm font-semibold text-foreground truncate w-full">{formatMoney(cashInHandMinor)}</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">Bank / Card</p>
          <p className="text-sm font-semibold text-foreground truncate w-full">{formatMoney(bankCardMinor)}</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#EADBC8] text-[#98682E] flex items-center justify-center shrink-0">
            <PiggyBank className="w-3.5 h-3.5" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98682E] leading-tight">Total Liquid</p>
          <p className="text-sm font-semibold text-[#7D5321] truncate w-full">{formatMoney(totalMinor)}</p>
        </div>
      </div>

      {/* Desktop/tablet: 3 separate cards */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
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
    </>
  );
}
