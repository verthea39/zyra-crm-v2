import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, AlertCircle } from "lucide-react";

type Metrics = {
  revenue: number;
  expenses: number;
  netProfit: number;
  receivables: number;
  payables: number;
};

const formatMoney = (minorUnits: number) => {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
};

function FormattedAmount({ minorUnits, className = "text-slate-900" }: { minorUnits: number, className?: string }) {
  return (
    <div className={`flex items-baseline mt-2 ${className}`}>
      <span className="text-xs font-semibold text-slate-400 mr-1.5 align-baseline">AED</span>
      <span className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(minorUnits)}</span>
    </div>
  );
}

export function MetricTiles({ metrics }: { metrics: Metrics }) {
  const baseCard = "bg-card rounded-xl border border-border border-t-2 border-t-[#98682E]/70 p-4 flex flex-col justify-between transition-all duration-150 hover:shadow-md relative overflow-hidden";
  const defaultIconWrapper = "p-2.5 rounded-xl bg-slate-50 border border-slate-100";
  const brandIconWrapper = "p-2.5 rounded-xl bg-[#FDF8F0] text-[#98682E] border border-[#EADBC8]";

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* 1. REVENUE */}
      <div className={`${baseCard}`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revenue (Billed)</p>
          <div className={brandIconWrapper}>
            <ArrowUpRight className="w-4 h-4 text-[#98682E]" />
          </div>
        </div>
        <FormattedAmount minorUnits={metrics.revenue} />
      </div>

      {/* 2. TOTAL EXPENSES */}
      <div className={`${baseCard}`}>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Expenses</p>
          <div className={defaultIconWrapper}>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
        </div>
        <FormattedAmount minorUnits={metrics.expenses} />
      </div>

      {/* 3. NET PROFIT */}
      <div className={`${baseCard} border-emerald-200 bg-emerald-50/50`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Net Profit</p>
          <div className={`${defaultIconWrapper} bg-white border-emerald-100`}>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <FormattedAmount minorUnits={metrics.netProfit} className="text-emerald-800" />
      </div>

      {/* 4. RECEIVABLES (AR) */}
      <div className={`${baseCard} border-amber-200 bg-amber-50/30`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30"></div>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Receivables (AR)</p>
          <div className={`${defaultIconWrapper} bg-white border-amber-100`}>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <FormattedAmount minorUnits={metrics.receivables} className="text-amber-800" />
      </div>

      {/* 5. PAYABLES (AP) */}
      <div className={`${baseCard} border-rose-200 bg-rose-50/30`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-30"></div>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Payables (AP)</p>
          <div className={`${defaultIconWrapper} bg-white border-rose-100`}>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
        </div>
        <FormattedAmount minorUnits={metrics.payables} className="text-rose-800" />
      </div>
    </div>
  );
}
