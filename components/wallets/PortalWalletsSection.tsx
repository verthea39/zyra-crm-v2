"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Landmark, Plus, ArrowRight } from "lucide-react";
import { TopUpModal } from "./TopUpModal";
import { AddWalletModal } from "./AddWalletModal";

export function PortalWalletsSection({ wallets }: { wallets: any[] }) {
  const [topUpWalletId, setTopUpWalletId] = useState<string | null>(null);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#98682E]" />
          <h3 className="text-sm font-bold text-foreground">Portal Wallets (Govt Escrow)</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddWalletOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[#98682E] hover:text-[#7D5321]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Portal Wallet
          </button>
          <Link href="/portal-wallets" className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
            Full Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {wallets.map((w: any) => {
          const isLow = w.balance <= (w.lowBalanceThreshold ?? 500);
          return (
            <div
              key={w.id}
              className={`border rounded-xl p-3 flex flex-col justify-between gap-2 shadow-sm ${
                isLow ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-slate-800 text-xs leading-tight">{w.entityName}</h4>
                {isLow && (
                  <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                    <AlertCircle className="w-2.5 h-2.5" /> Low
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-[#0F172A]">
                AED {w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <button
                onClick={() => setTopUpWalletId(w.id)}
                className="h-8 rounded-lg bg-[#FDF8F0] hover:bg-[#F7EEDB] text-[#98682E] text-xs font-semibold transition-colors"
              >
                Top Up
              </button>
            </div>
          );
        })}
      </div>

      {topUpWalletId && (
        <TopUpModal onClose={() => setTopUpWalletId(null)} wallets={wallets} defaultWalletId={topUpWalletId} />
      )}
      {isAddWalletOpen && <AddWalletModal onClose={() => setIsAddWalletOpen(false)} />}
    </div>
  );
}
