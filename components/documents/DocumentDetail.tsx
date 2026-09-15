"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/calculations";
import { deleteDocument } from "@/app/actions/documents";
import { Pencil, Printer, Trash2, FileText, FileSignature, Receipt } from "lucide-react";

const TYPE_ICON = { INVOICE: FileText, QUOTATION: FileSignature, RECEIPT: Receipt };

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 border-slate-200 text-slate-600",
  SENT: "bg-blue-50 border-blue-200 text-blue-700",
  PAID: "bg-emerald-50 border-emerald-200 text-emerald-700",
  OVERDUE: "bg-rose-50 border-rose-200 text-rose-700",
  CANCELLED: "bg-slate-100 border-slate-200 text-slate-400",
};

type DocumentWithRelations = {
  id: string;
  reference: string;
  type: "INVOICE" | "QUOTATION" | "RECEIPT";
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotalMinor: number;
  discountMinor: number;
  vatRate: number;
  vatMinor: number;
  totalMinor: number;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  expiryDate?: string | Date | null;
  notes?: string | null;
  client: { name: string; phone?: string | null };
  items: { id: string; description: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number; vatExempt: boolean }[];
};

export function DocumentDetail({ document }: { document: DocumentWithRelations }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const Icon = TYPE_ICON[document.type];
  const typeLabel = document.type.charAt(0) + document.type.slice(1).toLowerCase();

  const handleDelete = async () => {
    if (!confirm(`Delete ${typeLabel} ${document.reference}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await deleteDocument(document.id);
    setDeleting(false);
    if (res.success) {
      toast.success(`${typeLabel} deleted`);
      router.push("/documents");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-8">
      {/* Action bar -- always visible on every viewport, never hidden behind md: */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link href="/documents" className="text-sm text-slate-500 hover:text-slate-800 w-fit">
          &larr; Back to Documents
        </Link>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto">
          <Link
            href={`/documents/${document.id}/edit`}
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div data-print-area className="bg-white border border-border rounded-xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#FDF8F0] text-[#98682E] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ZYRA DOCUMENTS CLEARANCE SERVICES</h1>
              <p className="text-xs text-muted-foreground">Deira / Burj Nahar, Dubai, UAE</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl font-bold uppercase tracking-wide text-foreground">{typeLabel}</p>
            <p className="font-mono text-sm text-muted-foreground">{document.reference}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_STYLE[document.status]}`}>
              {document.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between mb-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Billed To</p>
            <p className="font-semibold text-foreground">{document.client.name}</p>
            {document.client.phone && <p className="text-muted-foreground">{document.client.phone}</p>}
          </div>
          <div className="sm:text-right">
            <p><span className="text-muted-foreground">Issue Date: </span>{new Date(document.issueDate).toLocaleDateString()}</p>
            {document.dueDate && <p><span className="text-muted-foreground">Due Date: </span>{new Date(document.dueDate).toLocaleDateString()}</p>}
            {document.expiryDate && <p><span className="text-muted-foreground">Expiry Date: </span>{new Date(document.expiryDate).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Mobile: stacked line items */}
        <div className="sm:hidden flex flex-col gap-2 mb-6">
          {document.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} x {formatMoney(item.unitPriceMinor)}{item.vatExempt ? " (VAT exempt)" : ""}</p>
              </div>
              <p className="text-sm font-semibold shrink-0">{formatMoney(item.lineTotalMinor)}</p>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <table className="hidden sm:table w-full text-sm text-left mb-6">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {document.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2">{item.description}{item.vatExempt ? <span className="text-xs text-muted-foreground"> (VAT exempt)</span> : null}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatMoney(item.unitPriceMinor)}</td>
                <td className="py-2 text-right font-medium">{formatMoney(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(document.subtotalMinor)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatMoney(document.discountMinor)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT ({document.vatRate}%)</span><span>{formatMoney(document.vatMinor)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2 text-base font-bold text-foreground">
              <span>Grand Total</span><span>{formatMoney(document.totalMinor)}</span>
            </div>
          </div>
        </div>

        {document.notes && (
          <div className="mt-6 pt-4 border-t border-dashed border-border text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Notes</p>
            <p>{document.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
