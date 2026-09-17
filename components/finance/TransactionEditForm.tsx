"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { Transaction } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { updateTransaction } from "@/app/actions/finance";
import type { LineItem } from "@/lib/printUtils";

export function TransactionEditForm({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(transaction.category);
  const [paymentMode, setPaymentMode] = useState(transaction.paymentMode || "");
  const [description, setDescription] = useState(transaction.description || "");
  const [dueDate, setDueDate] = useState(transaction.dueDate ? new Date(transaction.dueDate).toISOString().slice(0, 10) : "");
  const [items, setItems] = useState<LineItem[]>(
    (transaction.lineItems as any) || [
      { desc: transaction.category, govCost: (transaction.govFeePart || 0) / 100, proFee: (transaction.serviceFeePart || 0) / 100 },
    ]
  );

  const total = items.reduce((sum, i) => sum + i.govCost + i.proFee, 0);

  const handleSave = async () => {
    const validItems = items.filter((i) => i.desc.trim());
    if (validItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }
    setSaving(true);
    const res = await updateTransaction(transaction.id, {
      category,
      paymentMode: paymentMode || undefined,
      description: description || undefined,
      dueDate: dueDate || undefined,
      lineItems: validItems,
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
                  <th className="px-3 py-2 text-right w-28">Supplier / Govt Cost</th>
                  <th className="px-3 py-2 text-right w-28">Margin</th>
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={idx}>
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
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.govCost}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], govCost: parseFloat(e.target.value || "0") };
                          setItems(next);
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.proFee}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], proFee: parseFloat(e.target.value || "0") };
                          setItems(next);
                        }}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-sm font-semibold text-slate-600">New Total</span>
          <span className="text-lg font-bold text-slate-900">AED {total.toFixed(2)}</span>
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
