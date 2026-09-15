"use client";

import { AlertCircle, FileWarning, WalletCards, Activity } from "lucide-react";

type UrgencyData = {
  criticalExpiries: number;
  casesInMedical: number;
  pendingApprovals: number;
  lowBalanceWallets: number;
};

export function DailyUrgencyStrip({ data }: { data: UrgencyData }) {
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  const today = new Date().toLocaleDateString('en-AE', dateOptions);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            Good Morning, Operations Team
          </h1>
          <p className="text-sm font-medium text-[#98682E] mt-1 uppercase tracking-widest">
            {today}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Critical Expiries
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.criticalExpiries}
              </span>
              <span className="text-xs font-semibold text-rose-500">&lt; 48h</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Medical / Biometrics
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.casesInMedical}
              </span>
              <span className="text-xs font-semibold text-slate-400">Cases</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shrink-0">
            <FileWarning className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Pending Approvals
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.pendingApprovals}
              </span>
              <span className="text-xs font-semibold text-slate-400">MOHRE/ICP</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shrink-0">
            <WalletCards className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Low Wallets
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.lowBalanceWallets}
              </span>
              <span className="text-xs font-semibold text-slate-400">&lt; AED 2k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
