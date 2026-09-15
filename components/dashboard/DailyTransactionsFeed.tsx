"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, Plus } from "lucide-react";

export type DailyFeedItem = {
  id: string;
  transactionId: string;
  kind: "INCOME" | "EXPENSE";
  title: string;
  method: string | null;
  time: string | Date;
  amountMinor: number;
};

const formatMoney = (minorUnits: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2 }).format(minorUnits / 100);

const formatTime = (date: string | Date) =>
  `Today at ${new Intl.DateTimeFormat("en-AE", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(date))}`;

export function DailyTransactionsFeed({
  inflowMinor,
  outflowMinor,
  items,
}: {
  inflowMinor: number;
  outflowMinor: number;
  items: DailyFeedItem[];
}) {
  const netMinor = inflowMinor - outflowMinor;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Today's Transactions</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {new Intl.DateTimeFormat("en-AE", { weekday: "short", day: "2-digit", month: "short" }).format(new Date())}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Inflow</p>
          <p className="text-sm font-bold text-emerald-800 mt-1 truncate">{formatMoney(inflowMinor)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">Outflow</p>
          <p className="text-sm font-bold text-rose-800 mt-1 truncate">{formatMoney(outflowMinor)}</p>
        </div>
        <div className={`rounded-xl p-3 border ${netMinor >= 0 ? "bg-slate-50 border-slate-200" : "bg-amber-50 border-amber-200"}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${netMinor >= 0 ? "text-slate-600" : "text-amber-700"}`}>Net Flow</p>
          <p className={`text-sm font-bold mt-1 truncate ${netMinor >= 0 ? "text-slate-900" : "text-amber-800"}`}>{formatMoney(netMinor)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-muted-foreground">No transactions recorded today.</p>
          <Link
            href="/finance/cockpit"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#98682E] text-white text-xs font-semibold active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Record Payment / Expense
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/finance/transactions/${item.transactionId}`}
              className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[44px] active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    item.kind === "INCOME" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {item.kind === "INCOME" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{formatTime(item.time)}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${item.kind === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                  {item.kind === "INCOME" ? "+" : "-"}
                  {formatMoney(item.amountMinor)}
                </p>
                {item.method && (
                  <span
                    className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full border bg-white text-[9px] font-semibold uppercase tracking-wide ${
                      item.method.toLowerCase().includes("cash")
                        ? "border-emerald-300 text-emerald-700"
                        : "border-blue-300 text-blue-700"
                    }`}
                  >
                    <Receipt className="w-2.5 h-2.5" /> {item.method}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
