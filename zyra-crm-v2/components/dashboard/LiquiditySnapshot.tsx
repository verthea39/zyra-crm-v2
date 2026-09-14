"use client";

import { Landmark, Plus } from "lucide-react";
import Link from "next/link";

export type PortalBalance = {
  id: string;
  entityName: string;
  balance: number;
};

export function LiquiditySnapshot({ balances }: { balances: PortalBalance[] }) {
  // We'll set a soft target for the progress bar visually
  const TARGET_BALANCE = 5000;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full mt-4">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase flex items-center gap-2">
          <Landmark className="w-4 h-4 text-indigo-500" /> Portal Liquidity
        </h2>
        <Link href="/portal-wallets" className="text-[10px] font-bold text-[#98682E] hover:underline uppercase tracking-wider">
          Manage
        </Link>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {balances.map((wallet) => {
          const percent = Math.min((wallet.balance / TARGET_BALANCE) * 100, 100);
          const isLow = wallet.balance < 2000;
          
          return (
            <div key={wallet.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{wallet.entityName}</span>
                <span className={`text-xs font-bold tabular-nums ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                  AED {wallet.balance.toLocaleString()}
                </span>
              </div>
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {balances.length === 0 && (
          <div className="text-center text-slate-500 text-xs">
            No portal wallets configured.
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/portal-wallets"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" /> Top-Up Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
