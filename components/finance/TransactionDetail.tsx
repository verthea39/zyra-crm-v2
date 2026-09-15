"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Client, Transaction, TransactionPayment } from "@prisma/client";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Printer, Trash2, Receipt } from "lucide-react";
import { deleteTransaction } from "@/app/actions/finance";
import { downloadDocumentPDF, printViaIframe, type LineItem } from "@/lib/printUtils";
import { getBranding } from "@/app/actions/branding";
import { PaymentReceiptModal } from "./modals/PaymentReceiptModal";

const formatMoney = (minorUnits: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2 }).format(minorUnits / 100);

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en-AE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date)).replace(/\//g, "-");

type TransactionWithRelations = Transaction & {
  payments: TransactionPayment[];
  client: Client | null;
};

export function TransactionDetail({ transaction, clients }: { transaction: TransactionWithRelations; clients: Client[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const balance = transaction.amountTotal - transaction.amountPaid;
  const items: LineItem[] = (transaction.lineItems as any) || [
    { desc: transaction.category, govCost: (transaction.govFeePart || 0) / 100, proFee: (transaction.serviceFeePart || 0) / 100 },
  ];

  const handleDelete = async () => {
    if (!confirm(`Delete ${transaction.reference}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await deleteTransaction(transaction.id);
    setDeleting(false);
    if (res.success) {
      toast.success("Transaction deleted");
      router.push("/finance/cockpit");
    } else {
      toast.error(res.error || "Failed to delete transaction");
    }
  };

  const buildPrintPayload = () => ({
    type: "TAX_INVOICE" as const,
    clientName: transaction.counterparty,
    clientPhone: transaction.client?.phone || undefined,
    clientEmail: transaction.client?.email || undefined,
    date: formatDate(transaction.date),
    dueDate: transaction.dueDate ? formatDate(transaction.dueDate) : undefined,
    reference: transaction.reference,
    caseRef: transaction.reference,
    govCost: (transaction.govFeePart || 0) / 100,
    proFee: (transaction.serviceFeePart || 0) / 100,
    vatAmount: 0,
    totalPayable: transaction.amountTotal / 100,
    amountReceived: transaction.amountPaid / 100,
    lineItems: items,
  });

  const handleDownloadPDF = async () => {
    const branding = await getBranding().catch(() => undefined);
    try {
      await downloadDocumentPDF(buildPrintPayload(), branding);
    } catch {
      toast.error("PDF download failed. Use Print instead.", {
        action: { label: "Print", onClick: () => printViaIframe(buildPrintPayload(), branding) },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/finance/cockpit" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border pb-4 mb-4">
          <div>
            <p className="font-mono text-xs font-semibold text-slate-500">{transaction.reference}</p>
            <h1 className="text-lg font-bold text-foreground mt-0.5">{transaction.counterparty}</h1>
            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${
              transaction.type === "INCOME" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {transaction.type}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-foreground">{formatMoney(transaction.amountTotal)}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border bg-slate-100 border-slate-200 text-slate-600">
              {transaction.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-slate-900">{formatMoney(transaction.amountTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Paid</p>
            <p className="text-sm font-bold text-emerald-600">{formatMoney(transaction.amountPaid)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Balance</p>
            <p className={`text-sm font-bold ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{formatMoney(balance)}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Line Items</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{item.desc}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatMoney((item.govCost + item.proFee) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {transaction.payments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Payment History</h3>
            <div className="flex flex-col gap-2">
              {transaction.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{formatMoney(p.amountMinor)}</p>
                    <p className="text-xs text-slate-500">{p.method || "N/A"} {p.transactionRef ? `• ${p.transactionRef}` : ""}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(p.paidAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
          <button
            onClick={() => setShowPayment(true)}
            disabled={balance <= 0}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[#007A55] text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
          >
            <Receipt className="w-4 h-4" /> Record Payment
          </button>
          <Link
            href={`/finance/transactions/${transaction.id}/edit`}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Printer className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <PaymentReceiptModal
        open={showPayment}
        onOpenChange={setShowPayment}
        clients={clients}
        defaultClientId={transaction.clientId || undefined}
        defaultInvoiceRef={transaction.reference}
      />
    </div>
  );
}
