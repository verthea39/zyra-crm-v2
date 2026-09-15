"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/calculations";
import { deleteDocument } from "@/app/actions/documents";
import type { CompanyBranding } from "@/lib/companyBranding";
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

export function DocumentDetail({ document, branding }: { document: DocumentWithRelations; branding: CompanyBranding }) {
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

      {/* Printable content -- kept tight so a typical 3-5 item document fits one A4 page */}
      <div data-print-area className="bg-white border border-border rounded-xl p-4 sm:p-6 text-sm print:text-[11px] print:leading-tight">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b-2 border-[#98682E] pb-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#FDF8F0] text-[#98682E] flex items-center justify-center shrink-0 print:w-8 print:h-8">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-tight text-foreground leading-tight">{branding.name}</h1>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {branding.address}
                {[branding.phone && `Tel: ${branding.phone}`, branding.email, branding.trn && `TRN: ${branding.trn}`, branding.website]
                  .filter(Boolean)
                  .map((part) => ` | ${part}`)
                  .join("")}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-base font-extrabold uppercase tracking-wide text-foreground leading-tight">{typeLabel}</p>
            <p className="font-mono text-xs text-muted-foreground">{document.reference}</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_STYLE[document.status]}`}>
              {document.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between mb-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Billed To</p>
            <p className="font-semibold text-foreground text-sm">{document.client.name}</p>
            {document.client.phone && <p className="text-muted-foreground">{document.client.phone}</p>}
          </div>
          <div className="sm:text-right">
            <p><span className="text-muted-foreground">Issue Date: </span>{new Date(document.issueDate).toLocaleDateString()}</p>
            {document.dueDate && <p><span className="text-muted-foreground">Due Date: </span>{new Date(document.dueDate).toLocaleDateString()}</p>}
            {document.expiryDate && <p><span className="text-muted-foreground">Expiry Date: </span>{new Date(document.expiryDate).toLocaleDateString()}</p>}
            <p><span className="text-muted-foreground">Currency: </span>AED</p>
          </div>
        </div>

        {/* Mobile: stacked line items (hidden on print -- the table below is used for both screen-desktop and print) */}
        <div className="sm:hidden print:hidden flex flex-col gap-1.5 mb-3">
          {document.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.description}</p>
                <p className="text-[11px] text-muted-foreground">{item.quantity} x {formatMoney(item.unitPriceMinor)}{item.vatExempt ? " (VAT exempt)" : ""}</p>
              </div>
              <p className="text-xs font-semibold shrink-0">{formatMoney(item.lineTotalMinor)}</p>
            </div>
          ))}
        </div>

        {/* Desktop + print: table */}
        <table className="hidden sm:table print:table w-full text-xs text-left mb-3">
          <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="py-1.5 px-2">Description</th>
              <th className="py-1.5 px-2 text-right">Qty</th>
              <th className="py-1.5 px-2 text-right">Unit Price</th>
              <th className="py-1.5 px-2 text-right">VAT</th>
              <th className="py-1.5 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {document.items.map((item) => (
              <tr key={item.id} className="print:break-inside-avoid">
                <td className="py-1.5 px-2">{item.description}</td>
                <td className="py-1.5 px-2 text-right">{item.quantity}</td>
                <td className="py-1.5 px-2 text-right">{formatMoney(item.unitPriceMinor)}</td>
                <td className="py-1.5 px-2 text-right text-muted-foreground">{item.vatExempt ? "Exempt" : `${document.vatRate}%`}</td>
                <td className="py-1.5 px-2 text-right font-medium">{formatMoney(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end print:break-inside-avoid">
          <div className="w-full sm:w-64 space-y-1 text-xs border border-border rounded-lg p-2.5 bg-slate-50/60">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(document.subtotalMinor)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatMoney(document.discountMinor)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT ({document.vatRate}%)</span><span>{formatMoney(document.vatMinor)}</span></div>
            <div className="flex justify-between border-t-2 border-[#98682E] pt-1.5 mt-1.5 text-sm font-extrabold text-foreground">
              <span>Grand Total</span><span>{formatMoney(document.totalMinor)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions -- kept to essentials for single-page fit */}
        <div className="mt-3 border border-border rounded-lg p-2.5 text-[10px] text-muted-foreground print:break-inside-avoid">
          <span className="font-semibold text-foreground uppercase tracking-wide">Terms:</span>
          <ul className="list-disc list-inside leading-snug mt-0.5">
            {document.type === "QUOTATION" ? (
              <li>Valid for {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : "30 days from issue date"}; prices subject to change after expiry.</li>
            ) : (
              <li>Payment due {document.dueDate ? `by ${new Date(document.dueDate).toLocaleDateString()}` : (branding.paymentTerms || "within 14 days of invoice date")}.</li>
            )}
            <li>All amounts stated in AED.</li>
            {(branding.bankName || branding.iban) && (
              <li>Bank Transfer:{branding.bankName ? ` ${branding.bankName}` : ""}{branding.iban ? ` | IBAN: ${branding.iban}` : ""}{branding.swift ? ` | SWIFT: ${branding.swift}` : ""}</li>
            )}
          </ul>
          {document.notes && (
            <p className="mt-1"><span className="font-semibold text-foreground">Notes:</span> {document.notes}</p>
          )}
        </div>

        {/* Signatures + footer, combined into one slim bar */}
        <div className="flex items-end justify-between gap-4 mt-3 print:break-inside-avoid">
          <div className="w-2/5 text-center">
            <div className="h-6" />
            <div className="border-t border-slate-400 pt-1 text-[9px] text-muted-foreground">Authorized Signatory &mdash; {branding.name}</div>
          </div>
          <p className="flex-1 text-center text-[9px] text-slate-400">
            Thank you for choosing {branding.name}{branding.portalUrl ? ` | ${branding.portalUrl}` : ""}
          </p>
          <div className="w-2/5 text-center">
            <div className="h-6" />
            <div className="border-t border-slate-400 pt-1 text-[9px] text-muted-foreground">Client Acceptance / Stamp &mdash; {document.client.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
