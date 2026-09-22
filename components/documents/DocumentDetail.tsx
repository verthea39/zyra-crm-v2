"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  paidMinor: number;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  expiryDate?: string | Date | null;
  notes?: string | null;
  client: { name: string; phone?: string | null; place?: string | null; trnNumber?: string | null };
  items: { id: string; description: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number; vatExempt: boolean }[];
  convertedInvoice?: { id: string; reference: string } | null;
};

export function DocumentDetail({ document, branding, activity = [] }: { document: DocumentWithRelations; branding: CompanyBranding; activity?: ActivityEntry[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const typeLabel = document.type.charAt(0) + document.type.slice(1).toLowerCase();

  useEffect(() => {
    if (searchParams.get("autoprint") === "true") {
      const timer = setTimeout(() => window.print(), 500);
      window.history.replaceState(null, "", `/documents/${document.id}`);
      return () => clearTimeout(timer);
    }
  }, [searchParams, document.id]);

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

      {/* @page rule can't be expressed as a Tailwind class -- A4 portrait
          with 12mm margins for every browser print/PDF path this hits. */}
      <style>{`@page { size: A4 portrait; margin: 12mm; }`}</style>

      {/* Printable content -- kept tight so a typical 3-5 item document fits one A4 page */}
      <div data-print-area className="bg-white border border-border rounded-xl p-4 sm:p-6 print:p-8 text-sm print:text-[11px] print:leading-tight">
        {/* 1. Brand header -- logo + business details left, document badge right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b-2 pb-3 mb-4" style={{ borderColor: "#9B722B" }}>
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <img
              src={ZYRA_LOGO_GOLD_PATH}
              alt={branding.name}
              className="h-10 w-auto object-contain shrink-0 print:h-9"
            />
            <div className="text-[10.5px] text-slate-600 leading-snug min-w-0">
              <p className="font-semibold text-slate-800 text-xs">{branding.name}</p>
              <p>{branding.address}</p>
              <p>
                {[branding.phone && `Tel: ${branding.phone}`, branding.email && `Email: ${branding.email}`]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
              <p>
                {[branding.website && `Web: ${branding.website}`, branding.trn && `TRN: ${branding.trn}`]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            </div>
          </div>
          {/* min-w-0 above lets the address block wrap/shrink first, so this
              column -- title, full reference, and status badge -- always
              keeps its natural width instead of being clipped by the page
              edge on print. */}
          <div className="text-left sm:text-right shrink-0 w-full sm:w-auto sm:max-w-[45%] sm:pl-4">
            <p className="text-lg font-extrabold uppercase tracking-wide text-slate-900 leading-tight">{typeLabel}</p>
            <p className="font-mono text-xs text-slate-500 break-all mt-0.5">Invoice No: {document.reference}</p>
            <p className="text-[10.5px] text-slate-500 mt-1">Issue Date: {new Date(document.issueDate).toLocaleDateString('en-GB')}</p>
            {document.dueDate && <p className="text-[10.5px] text-slate-500">Due Date: {new Date(document.dueDate).toLocaleDateString('en-GB')}</p>}
            <span className={`inline-block mt-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_STYLE[document.status]}`}>
              {document.status}
            </span>
          </div>
        </div>

        {/* 2. Client & meta info strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-slate-50/70 border border-slate-100 rounded-lg p-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice To</p>
            <p className="font-bold text-slate-900 text-sm">{document.client.name}</p>
            {document.client.phone && <p className="text-slate-600 text-xs mt-0.5">{document.client.phone}</p>}
            {document.client.place && <p className="text-slate-600 text-xs">{document.client.place}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Summary</p>
            <p className="text-slate-600 text-xs">Currency: <span className="font-semibold text-slate-800">AED</span></p>
            {document.dueDate && <p className="text-slate-600 text-xs">Payment Due: <span className="font-semibold text-slate-800">{new Date(document.dueDate).toLocaleDateString('en-GB')}</span></p>}
            {document.expiryDate && <p className="text-slate-600 text-xs">Valid Until: <span className="font-semibold text-slate-800">{new Date(document.expiryDate).toLocaleDateString('en-GB')}</span></p>}
            {document.client.trnNumber && <p className="text-slate-600 text-xs">Client TRN: <span className="font-semibold text-slate-800">{document.client.trnNumber}</span></p>}
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

        {/* 3. Line items table -- desktop + print */}
        <table className="hidden sm:table print:table w-full text-xs text-left mb-4 border border-slate-100 rounded-lg overflow-hidden" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 align-middle text-center leading-normal w-10">#</th>
              <th className="py-3 px-4 align-middle text-left leading-normal">Description</th>
              <th className="py-3 px-4 align-middle text-center leading-normal">Qty</th>
              <th className="py-3 px-4 align-middle text-right leading-normal font-mono">Unit Price (AED)</th>
              <th className="py-3 px-4 align-middle text-right leading-normal">VAT</th>
              <th className="py-3 px-4 align-middle text-right leading-normal font-mono">Total (AED)</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, idx) => (
              <tr key={item.id} className="print:break-inside-avoid border-b border-slate-100 even:bg-slate-50/40 hover:bg-slate-50/50">
                <td className="py-3 px-4 align-middle text-center leading-normal text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 align-middle text-left leading-normal">{item.description}</td>
                <td className="py-3 px-4 align-middle text-center leading-normal">{item.quantity}</td>
                <td className="py-3 px-4 align-middle text-right leading-normal font-mono">{formatMoney(item.unitPriceMinor)}</td>
                <td className="py-3 px-4 align-middle text-right leading-normal text-muted-foreground">{item.vatExempt ? "Exempt" : `${document.vatRate}%`}</td>
                <td className="py-3 px-4 align-middle text-right leading-normal font-mono font-medium">{formatMoney(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Totals & calculation card */}
        <div className="flex justify-end print:break-inside-avoid mb-4">
          <div className="w-full sm:w-72 space-y-1.5 text-xs border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-800">{formatMoney(document.subtotalMinor)}</span></div>
            {document.discountMinor > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-slate-800">-{formatMoney(document.discountMinor)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">VAT ({document.vatRate > 0 ? `${document.vatRate}%` : "Exempt"})</span><span className="font-medium text-slate-800">{formatMoney(document.vatMinor)}</span></div>
            <div className="flex justify-between items-center border-t-2 pt-1.5 mt-1.5 text-sm font-extrabold text-slate-900 rounded px-1 -mx-1" style={{ borderColor: "#9B722B", backgroundColor: "#9B722B0D" }}>
              <span>Grand Total</span><span>{formatMoney(document.totalMinor)}</span>
            </div>
            {document.type !== "QUOTATION" && (
              <>
                <div className="flex justify-between pt-1"><span className="text-slate-500">Paid Amount</span><span className="font-medium text-emerald-600">{formatMoney(document.paidMinor)}</span></div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Outstanding Balance</span>
                  <span className={document.totalMinor - document.paidMinor > 0 ? "text-rose-600" : "text-emerald-600"}>
                    {formatMoney(Math.max(0, document.totalMinor - document.paidMinor))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5. Terms & signature footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:break-inside-avoid">
          <div className="border border-slate-200 rounded-lg p-3 text-[10px] text-slate-600">
            <span className="font-semibold text-slate-800 uppercase tracking-wide">Terms & Conditions</span>
            <ul className="list-disc list-inside leading-snug mt-1 space-y-0.5">
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
              <p className="mt-1.5"><span className="font-semibold text-slate-800">Notes:</span> {document.notes}</p>
            )}
          </div>

          {/* Dual signature columns -- ample clearance above each line so a
              physical or digital signature/stamp has room to sit cleanly. */}
          <div className="flex items-end justify-between gap-4 pt-2">
            <div className="w-1/2 text-center">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signatory<br />&mdash; {branding.name}</div>
            </div>
            <div className="w-1/2 text-center">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500">Client Acceptance & Stamp<br />&mdash; {document.client.name}</div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-6 pb-2 print:break-inside-avoid">
          Thank you for your business{branding.portalUrl ? ` | ${branding.portalUrl}` : ""}
        </p>
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
