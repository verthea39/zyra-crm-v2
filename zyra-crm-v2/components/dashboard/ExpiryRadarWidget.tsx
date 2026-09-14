"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export type RadarExpiry = {
  id: string;
  title: string;
  category: string;
  clientName: string | null;
  employeeName: string | null;
  daysRemaining: number;
  expiryDate: Date;
};

export function ExpiryRadarWidget({ expiries }: { expiries: RadarExpiry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" /> 30-Day Expiry Radar
        </h2>
        <Link href="/vault" className="text-[10px] font-bold text-[#98682E] hover:underline uppercase tracking-wider">
          View Vault
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {expiries.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <p className="text-xs">No upcoming expiries in the next 30 days.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {expiries.map((exp) => (
              <li key={exp.id} className="p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    {exp.employeeName || exp.clientName || "Unknown"}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {exp.category} - {exp.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                      exp.daysRemaining < 15 
                        ? "bg-rose-50 border-rose-200 text-rose-800" 
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      {exp.daysRemaining} Days
                    </span>
                  </div>
                  <Link href="/vault" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
