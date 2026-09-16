"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/calculations";
import { deleteDocument, convertQuotationToInvoice } from "@/app/actions/documents";
import type { CompanyBranding } from "@/lib/companyBranding";
import { Pencil, Printer, Trash2, FileText, FileSignature, Receipt, History, Repeat } from "lucide-react";
import { ZYRA_LOGO_GOLD_PATH } from "@/lib/brandAssets";
import { formatDistanceToNow } from "date-fns";

type ActivityEntry = {
  id: string;
  action: string;
  title: string;
  actorName: string;
  createdAt: string | Date;
};

const TYPE_ICON = { INVOICE: FileText, QUOTATION: FileSignature, RECEIPT: Receipt };

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 border-slate-200 text-slate-600",
  SENT: "bg-blue-50 border-blue-200 text-blue-700",
  PAID: "bg-emerald-50 border-emerald-200 text-emerald-700",
  OVERDUE: "bg-rose-50 border-rose-200 text-rose-700",
  CANCELLED: "bg-slate-100 border-slate-200 text-slate-400",
  CONVERTED: "bg-violet-50 border-violet-200 text-violet-700",
};

type DocumentWithRelations = {
  id: string;
  reference: string;
  type: "INVOICE" | "QUOTATION" | "RECEIPT";
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "CONVERTED";
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
  convertedInvoice?: { id: string; reference: string } | null;
};

export function DocumentDetail({ document, branding, activity = [] }: { document: DocumentWithRelations; branding: CompanyBranding; activity?: ActivityEntry[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
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

  const handleConvert = async () => {
    if (!confirm(`Convert this quotation into an official tax invoice?`)) return;
    setConverting(true);
    const res = await convertQuotationToInvoice(document.id);
    setConverting(false);
    if (res.success && res.invoice) {
      toast.success(`Converted to Invoice #${res.invoice.reference}`);
      router.push(`/documents/${res.invoice.id}`);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to convert quotation");
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-28 print:pb-8">
      {/* Action bar -- always visible on every viewport, never hidden behind md: */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link href="/documents" className="text-sm text-slate-500 hover:text-slate-800 w-fit">
          &larr; Back to Documents
        </Link>
        <div className={`grid gap-2 sm:flex sm:w-auto ${document.type === "QUOTATION" ? "grid-cols-2" : "grid-cols-3"}`}>
          {document.type === "QUOTATION" && (
            document.convertedInvoice ? (
              <Link
                href={`/documents/${document.convertedInvoice.id}`}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 font-semibold text-sm active:scale-95 transition-transform"
              >
                <Repeat className="w-4 h-4" /> Converted ({document.convertedInvoice.reference})
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleConvert}
                disabled={converting}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border border-[#98682E] bg-[#98682E] text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                <Repeat className="w-4 h-4" /> {converting ? "Converting..." : "Convert to Invoice"}
              </button>
            )
          )}
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
            <img
              src={ZYRA_LOGO_GOLD_PATH}
              alt="Zyra"
              className="h-9 w-auto object-contain shrink-0 print:h-8"
            />
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
            <p><span className="text-muted-foreground">Issue Date: </span>{new Date(document.issueDate).toLocaleDateString('en-GB')}</p>
            {document.dueDate && <p><span className="text-muted-foreground">Due Date: </span>{new Date(document.dueDate).toLocaleDateString('en-GB')}</p>}
            {document.expiryDate && <p><span className="text-muted-foreground">Expiry Date: </span>{new Date(document.expiryDate).toLocaleDateString('en-GB')}</p>}
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
        <table className="hidden sm:table print:table w-full text-xs text-left mb-3" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="py-3 px-3 align-middle text-left leading-normal">Description</th>
              <th className="py-3 px-3 align-middle text-center leading-normal">Qty</th>
              <th className="py-3 px-3 align-middle text-right leading-normal font-mono">Unit Price</th>
              <th className="py-3 px-3 align-middle text-right leading-normal">VAT</th>
              <th className="py-3 px-3 align-middle text-right leading-normal font-mono">Total</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id} className="print:break-inside-avoid border-b border-slate-200">
                <td className="py-3 px-3 align-middle text-left leading-normal">{item.description}</td>
                <td className="py-3 px-3 align-middle text-center leading-normal">{item.quantity}</td>
                <td className="py-3 px-3 align-middle text-right leading-normal font-mono">{formatMoney(item.unitPriceMinor)}</td>
                <td className="py-3 px-3 align-middle text-right leading-normal text-muted-foreground">{item.vatExempt ? "Exempt" : `${document.vatRate}%`}</td>
                <td className="py-3 px-3 align-middle text-right leading-normal font-mono font-medium">{formatMoney(item.lineTotalMinor)}</td>
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
              <li>Valid for {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString('en-GB') : "30 days from issue date"}; prices subject to change after expiry.</li>
            ) : (
              <li>Payment due {document.dueDate ? `by ${new Date(document.dueDate).toLocaleDateString('en-GB')}` : (branding.paymentTerms || "within 14 days of invoice date")}.</li>
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

      {/* Audit History -- never shown on print */}
      <div className="print:hidden mt-4 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Audit History</h3>
        </div>
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recorded activity for this document yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 text-xs">
                <p className="text-foreground leading-snug">{entry.title}</p>
                <span className="text-muted-foreground shrink-0 whitespace-nowrap">
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
                    } catch {
                      return "";
                    }
                  })()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
