"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Search, Filter } from "lucide-react";

export function WalletLedger({ wallets, clients }: { wallets: any[], clients: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPortal, setFilterPortal] = useState("All");
  const [filterType, setFilterType] = useState("All");

  // Flatten all transactions from all wallets
  const allTransactions = useMemo(() => {
    const txs: any[] = [];
    wallets.forEach(w => {
      w.transactions.forEach((t: any) => {
        txs.push({ ...t, portalName: w.entityName });
      });
    });
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wallets]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const matchSearch = t.receiptRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description?.toLowerCase().includes(searchQuery.toLowerCase());
                          
      const matchPortal = filterPortal === "All" || t.portalName === filterPortal;
      const matchType = filterType === "All" || t.type === filterType;

      return matchSearch && matchPortal && matchType;
    });
  }, [allTransactions, searchQuery, filterPortal, filterType]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ref, client, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-sm transition-all shadow-sm"
          />
        </div>

        <select
          value={filterPortal}
          onChange={(e) => setFilterPortal(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-sm appearance-none shadow-sm min-w-[150px]"
        >
          <option value="All">All Portals</option>
          {wallets.map(w => <option key={w.id} value={w.entityName}>{w.entityName}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-sm appearance-none shadow-sm min-w-[120px]"
        >
          <option value="All">All Types</option>
          <option value="TOP_UP">Top-Ups</option>
          <option value="DEDUCTION">Deductions</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Desktop Table View */}
        <div className="hidden md:block min-w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0F172A] text-slate-300 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Gov Portal</th>
                <th className="px-6 py-4 font-semibold">Client / Case</th>
                <th className="px-6 py-4 font-semibold">Gov Receipt</th>
                <th className="px-6 py-4 font-semibold text-right">Amount (AED)</th>
                <th className="px-6 py-4 font-semibold text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 italic">No transactions found.</td></tr>
              ) : filteredTransactions.map((t: any) => {
                const isCredit = t.type === "TOP_UP";
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{format(new Date(t.date), "dd MMM yyyy")}</div>
                      <div className="text-xs text-slate-500">{format(new Date(t.date), "hh:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {t.portalName.split(" ")[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isCredit ? (
                        <span className="text-slate-400 italic text-xs">{t.description}</span>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-900">{t.client?.name || "Internal / Unknown"}</div>
                          <div className="text-xs text-slate-500">{t.description}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 border border-slate-100">
                        {t.receiptRef || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold flex items-center justify-end gap-1 ${isCredit ? 'text-[#007A55]' : 'text-[#C5002F]'}`}>
                        {isCredit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isCredit ? '+' : '-'} AED {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      AED {t.balanceAfter?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col p-4 gap-3 pb-20">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">No transactions found.</div>
          ) : filteredTransactions.map((t: any) => {
            const isCredit = t.type === "TOP_UP";
            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block border border-slate-200">
                      {t.portalName.split(" ")[0]}
                    </span>
                    <div className="text-xs text-slate-500">{format(new Date(t.date), "dd MMM yyyy, hh:mm a")}</div>
                  </div>
                  <div className={`font-bold text-sm flex items-center gap-1 ${isCredit ? 'text-[#007A55]' : 'text-[#C5002F]'}`}>
                    {isCredit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {isCredit ? '+' : '-'} AED {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="text-sm font-medium text-slate-900 leading-tight">
                  {isCredit ? t.description : t.client?.name || "Internal / Unknown"}
                </div>
                {!isCredit && <div className="text-xs text-slate-500">{t.description}</div>}

                <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase">Gov Receipt</span>
                    <span className="font-mono text-xs text-slate-600">{t.receiptRef || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">Balance After</span>
                    <span className="text-xs font-bold text-slate-700">
                      AED {t.balanceAfter?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
