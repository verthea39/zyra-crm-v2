"use client";

import { Wallet, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function WalletCards({ wallets }: { wallets: any[] }) {
  const LOW_BALANCE_THRESHOLD = 2000;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map(wallet => {
          const isLow = wallet.balance < LOW_BALANCE_THRESHOLD;
          const baseCard = "bg-card rounded-xl border border-border p-5 flex flex-col transition-all duration-150 hover:shadow-md relative overflow-hidden";
          const iconWrapper = "p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center";

          return (
            <div 
              key={wallet.id} 
              className={`${baseCard} ${isLow ? 'border-amber-200 bg-amber-50/50' : ''}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${isLow ? 'via-amber-500' : 'via-[#C5A059]'} to-transparent opacity-50`}></div>
              
              {isLow && (
                <div className="absolute top-0 left-0 right-0 bg-amber-100 border-b border-amber-200 text-amber-800 text-[10px] font-bold text-center py-0.5 tracking-widest uppercase">
                  Low Balance Alert
                </div>
              )}
              
              <div className={`flex justify-between items-start ${isLow ? 'mt-4' : ''}`}>
                <div className={iconWrapper}>
                  <Wallet className={`w-5 h-5 ${isLow ? 'text-amber-400' : 'text-primary'}`} />
                </div>
                <button className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors border border-slate-200">
                  Top-Up
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">{wallet.entityName}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-400 font-medium mr-1.5">AED</span>
                  <span className="text-2xl font-black text-foreground tracking-tight">
                    {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-border bg-slate-50/80">
          <h2 className="font-bold text-lg text-foreground tracking-tight">Portal Outflow Log</h2>
          <p className="text-sm text-muted-foreground">Recent government deductions and top-ups</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-border text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Reference / Receipt</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {wallets.flatMap(w => w.transactions).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15).map(tx => {
                const wallet = wallets.find(w => w.id === tx.walletId);
                const isDeduction = tx.type === 'DEDUCTION';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group bg-card">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {wallet?.entityName}
                    </td>
                    <td className="px-6 py-4">
                      {tx.caseRef ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded w-max mb-1">
                            {tx.caseRef}
                          </span>
                          <span className="text-xs text-muted-foreground">{tx.receiptRef}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{tx.receiptRef || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                      {tx.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      <div className={`flex items-center justify-end gap-1 ${isDeduction ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDeduction ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {wallets.flatMap(w => w.transactions).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No transactions recorded in the portal wallets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
