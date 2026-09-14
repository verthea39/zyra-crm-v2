"use client";

import { AlertTriangle, Clock } from "lucide-react";

export function ExpiryRadar({ documents }: { documents: any[] }) {
  const now = new Date();
  
  const docsWithExpiry = documents.filter(d => d.expiryDate).map(d => {
    const expiry = new Date(d.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...d, diffDays };
  });

  const critical = docsWithExpiry.filter(d => d.diffDays <= 15 && d.diffDays > 0);
  const dueSoon = docsWithExpiry.filter(d => d.diffDays > 15 && d.diffDays <= 30);
  const expired = docsWithExpiry.filter(d => d.diffDays <= 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 transition-all duration-150 hover:border-slate-300 hover:shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      
      <h2 className="font-bold flex items-center gap-2 text-foreground">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        Expiry Radar
      </h2>

      {expired.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1 mb-2 tracking-wider">
            <AlertTriangle className="w-3 h-3" /> EXPIRED ({expired.length})
          </h3>
          <div className="space-y-2">
            {expired.slice(0, 3).map(d => (
              <div key={d.id} className="text-[11px] flex justify-between font-medium">
                <span className="truncate max-w-[150px] text-rose-950">{d.title}</span>
                <span className="text-rose-600">Expired {Math.abs(d.diffDays)}d ago</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {critical.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h3 className="text-xs font-bold text-amber-800 mb-2 tracking-wider">
            CRITICAL ({critical.length})
          </h3>
          <div className="space-y-2">
            {critical.slice(0, 3).map(d => (
              <div key={d.id} className="text-[11px] flex justify-between font-medium">
                <span className="truncate max-w-[150px] text-amber-950">{d.title}</span>
                <span className="text-amber-600">In {d.diffDays}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h3 className="text-xs font-bold text-slate-600 mb-2 tracking-wider">
            DUE SOON ({dueSoon.length})
          </h3>
          <div className="space-y-2">
            {dueSoon.slice(0, 3).map(d => (
              <div key={d.id} className="text-[11px] flex justify-between font-medium">
                <span className="truncate max-w-[150px] text-slate-800">{d.title}</span>
                <span className="text-slate-500">In {d.diffDays}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expired.length === 0 && critical.length === 0 && dueSoon.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 text-center p-4 rounded-lg">
          <p className="text-sm font-medium text-emerald-800">All documents are healthy!</p>
        </div>
      )}
    </div>
  );
}
