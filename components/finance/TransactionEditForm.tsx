"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { Transaction, TransactionPayment } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { updateTransaction, deleteTransactionPayment } from "@/app/actions/finance";
import type { LineItem } from "@/lib/printUtils";
import { ProfitBadge } from "@/components/finance/modals/ProfitBadge";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Cheque"];

type TransactionWithPayments = Transaction & { payments: TransactionPayment[] };

type PaymentDraft = {
  id: string;
  amount: string; // AED, display units -- kept as text while editing
  method: string;
  paidAt: string; // yyyy-mm-dd
};

// govCost = supplier/govt cost, proFee = margin, so govCost + proFee is
// always the Service Charge shown to the client -- same invariant used by
// AddIncomeModal/QuotationModal/TaxInvoiceModal.
function initialItems(transaction: Transaction): LineItem[] {
  if (transaction.type === "EXPENSE") {
    // Expenses have no margin concept -- a single flat Amount/Cost, kept in
    // `proFee` internally so the shared total math (govCost + proFee) still
    // works. Trust a stored line item only if it actually adds up to
    // something; a null, missing, or zeroed-out entry (e.g. from a previous
    // save made before this fallback existed) falls back to the real billed
    // amount instead of showing AED 0.00.
    const stored = transaction.lineItems as LineItem[] | null;
    const storedTotal = stored?.reduce((sum, i) => sum + i.govCost + i.proFee, 0) || 0;
    if (stored && storedTotal > 0) return stored;
    return [{ desc: transaction.category, govCost: 0, proFee: transaction.amountTotal / 100 }];
  }

  if (transaction.lineItems) return transaction.lineItems as any;

  const govCost = (transaction.govFeePart || 0) / 100;
  const serviceFee = (transaction.serviceFeePart || 0) / 100;
  if (govCost + serviceFee > 0) {
    return [{ desc: transaction.category, govCost, proFee: serviceFee }];
  }

  // Legacy/seeded transactions have neither lineItems nor a recorded
  // gov/service split -- fall back to the real billed amount as the Service
  // Charge (supplier cost unknown, defaults to 0) instead of silently
  // zeroing out the invoice total on save.
  return [{ desc: transaction.category, govCost: 0, proFee: transaction.amountTotal / 100 }];
}

function toDraft(p: TransactionPayment): PaymentDraft {
  return {
    id: p.id,
    amount: (p.amountMinor / 100).toFixed(2),
    method: p.method || "Cash",
    paidAt: new Date(p.paidAt).toISOString().slice(0, 10),
  };
}

export function TransactionEditForm({ transaction }: { transaction: TransactionWithPayments }) {
  const router = useRouter();
  const isExpense = transaction.type === "EXPENSE";
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [category, setCategory] = useState(transaction.category);
  const [paymentMode, setPaymentMode] = useState(transaction.paymentMode || "");
  const [description, setDescription] = useState(transaction.description || "");
  const [dueDate, setDueDate] = useState(transaction.dueDate ? new Date(transaction.dueDate).toISOString().slice(0, 10) : "");
  const [items, setItems] = useState<LineItem[]>(() => initialItems(transaction));
  const [payments, setPayments] = useState<PaymentDraft[]>(() => transaction.payments.map(toDraft));
  // Flat paid-amount override for transactions with no itemized
  // TransactionPayment rows (bulk imports, legacy invoices) -- when rows
  // exist, they remain the source of truth and this field just mirrors them.
  const [directPaid, setDirectPaid] = useState((transaction.amountPaid / 100).toFixed(2));
  const hasPaymentRows = payments.length > 0;

  const total = items.reduce((sum, i) => sum + i.govCost + i.proFee, 0);
  const totalPaid = hasPaymentRows
    ? payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    : parseFloat(directPaid) || 0;
  const outstanding = total - totalPaid;
  const previewStatus = totalPaid <= 0 ? "PENDING" : outstanding <= 0 ? "PAID" : "PARTIALLY PAID";
  const previewStatusClass =
    previewStatus === "PAID" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : previewStatus === "PARTIALLY PAID" ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-slate-100 border-slate-200 text-slate-600";

  const updatePayment = (id: string, patch: Partial<PaymentDraft>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleDeletePayment = async (id: string, amountLabel: string) => {
    if (!confirm(`Delete this payment of AED ${amountLabel}? This cannot be undone -- the outstanding balance will increase accordingly.`)) return;
    setDeletingId(id);
    const res = await deleteTransactionPayment(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Payment deleted");
      setPayments((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete payment");
    }
  };

  const handleSave = async () => {
    const validItems = items.filter((i) => i.desc.trim());
    if (validItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }
    for (const p of payments) {
      if (!p.paidAt || isNaN(parseFloat(p.amount))) {
        toast.error("Every payment needs a valid amount and date");
        return;
      }
    }
    if (!hasPaymentRows && isNaN(parseFloat(directPaid))) {
      toast.error("Amount Paid by Client must be a valid number");
      return;
    }
    setSaving(true);
    const res = await updateTransaction(transaction.id, {
      category,
      paymentMode: paymentMode || undefined,
      description: description || undefined,
      dueDate: dueDate || undefined,
      lineItems: validItems,
      payments: payments.map((p) => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        method: p.method,
        paidAt: p.paidAt,
      })),
      amountPaid: hasPaymentRows ? undefined : parseFloat(directPaid) || 0,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Transaction updated");
      router.push(`/finance/transactions/${transaction.id}`);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update transaction");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/finance/transactions/${transaction.id}`} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <h1 className="text-lg font-bold text-foreground">Edit {transaction.reference}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="e.g. Bank Transfer" />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Line Items</Label>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="px-3 py-2">Description</th>
                  {isExpense ? (
                    <th className="px-3 py-2 text-right w-32">Amount / Cost (AED) *</th>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-right w-32">Service Charge (AED) *</th>
                      <th className="px-3 py-2 text-right w-32">Supplier / Govt Cost (AED)</th>
                    </>
                  )}
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => {
                  const serviceCharge = item.govCost + item.proFee;
                  return (
                    <Fragment key={idx}>
                      <tr>
                        <td className="px-2 py-2">
                          <Input
                            value={item.desc}
                            onChange={(e) => {
                              const next = [...items];
                              next[idx] = { ...next[idx], desc: e.target.value };
                              setItems(next);
                            }}
                            placeholder="Service description"
                          />
                        </td>
                        {isExpense ? (
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={serviceCharge}
                              onChange={(e) => {
                                const next = [...items];
                                // No margin concept on expenses -- the whole
                                // amount lives in proFee, govCost stays 0.
                                next[idx] = { ...next[idx], govCost: 0, proFee: parseFloat(e.target.value || "0") };
                                setItems(next);
                              }}
                            />
                          </td>
                        ) : (
                          <>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={serviceCharge}
                                onChange={(e) => {
                                  const newCharge = parseFloat(e.target.value || "0");
                                  const next = [...items];
                                  // Keep supplier cost fixed; the margin absorbs the change.
                                  next[idx] = { ...next[idx], proFee: newCharge - next[idx].govCost };
                                  setItems(next);
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.govCost}
                                onChange={(e) => {
                                  const newCost = parseFloat(e.target.value || "0");
                                  const next = [...items];
                                  // Keep the Service Charge fixed; the margin absorbs the change.
                                  next[idx] = { ...next[idx], govCost: newCost, proFee: serviceCharge - newCost };
                                  setItems(next);
                                }}
                              />
                            </td>
                          </>
                        )}
                        <td className="px-2 py-2 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {!isExpense && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-3 pb-2 pt-0">
                            <ProfitBadge customerRate={serviceCharge} supplierCost={item.govCost} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setItems([...items, { desc: "", govCost: 0, proFee: 0 }])}
            className="flex items-center gap-1.5 text-sm font-medium text-[#98682E]"
          >
            <Plus className="w-4 h-4" /> Add Line Item
          </button>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Amount Paid by Client (AED)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={directPaid}
            disabled={hasPaymentRows}
            onChange={(e) => setDirectPaid(e.target.value)}
          />
          {hasPaymentRows && (
            <p className="text-[11px] text-slate-400">
              This transaction has itemized payments below -- edit those rows to change the paid amount.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Recorded Payments</Label>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400 italic border border-dashed border-border rounded-lg px-3 py-4 text-center">
              No payments recorded against this transaction yet.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="px-3 py-2 w-32">Amount (AED)</th>
                    <th className="px-3 py-2 w-36">Payment Mode</th>
                    <th className="px-3 py-2 w-36">Date</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.amount}
                          onChange={(e) => updatePayment(p.id, { amount: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={p.method}
                          onChange={(e) => updatePayment(p.id, { method: e.target.value })}
                          className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <Input type="date" value={p.paidAt} onChange={(e) => updatePayment(p.id, { paidAt: e.target.value })} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => handleDeletePayment(p.id, p.amount)}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-50"
                          title="Delete this payment"
                        >
                          {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Editing amount/method/date here saves with "Save Changes" below. Deleting a payment happens immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-border text-sm">
          <div>
            <span className="text-slate-500">Total Billed</span>
            <p className="text-lg font-bold text-slate-900">AED {total.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500">Total Paid</span>
            <p className="text-lg font-bold text-emerald-600">AED {totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500">Outstanding Balance</span>
            <p className={`text-lg font-bold ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>AED {outstanding.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500">Status (on save)</span>
            <p className="mt-1">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${previewStatusClass}`}>
                {previewStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/finance/transactions/${transaction.id}`} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
