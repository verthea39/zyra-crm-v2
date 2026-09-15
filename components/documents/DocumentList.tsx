"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/calculations";
import { FileText, FileSignature, Receipt, Plus, ChevronRight } from "lucide-react";

type DocumentRow = {
  id: string;
  reference: string;
  type: "INVOICE" | "QUOTATION" | "RECEIPT";
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  totalMinor: number;
  issueDate: string | Date;
  client: { name: string };
};

const TYPE_ICON = { INVOICE: FileText, QUOTATION: FileSignature, RECEIPT: Receipt };

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 border-slate-200 text-slate-600",
  SENT: "bg-blue-50 border-blue-200 text-blue-700",
  PAID: "bg-emerald-50 border-emerald-200 text-emerald-700",
  OVERDUE: "bg-rose-50 border-rose-200 text-rose-700",
  CANCELLED: "bg-slate-100 border-slate-200 text-slate-400",
};

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INVOICE" | "QUOTATION" | "RECEIPT">("ALL");

  const filtered = useMemo(
    () => (typeFilter === "ALL" ? documents : documents.filter((d) => d.type === typeFilter)),
    [documents, typeFilter]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold sm:text-2xl text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Invoices, quotations, and receipts in one place</p>
        </div>
        <Link
          href="/documents/new"
          className="w-full md:w-auto flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#98682E] text-white font-semibold active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> New Document
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(["ALL", "INVOICE", "QUOTATION", "RECEIPT"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold transition-colors active:scale-95 ${
              typeFilter === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase() + "s"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-card border border-border rounded-xl">
          <FileText className="w-10 h-10 text-slate-300" />
          <p className="text-muted-foreground text-sm">No documents yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="md:hidden flex flex-col gap-2">
            {filtered.map((doc) => {
              const Icon = TYPE_ICON[doc.type];
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 min-h-[44px] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#FDF8F0] text-[#98682E] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{doc.client.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{doc.reference}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatMoney(doc.totalMinor)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_STYLE[doc.status]}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: compact table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{doc.reference}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{doc.client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.type.charAt(0) + doc.type.slice(1).toLowerCase()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(doc.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(doc.totalMinor)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_STYLE[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
