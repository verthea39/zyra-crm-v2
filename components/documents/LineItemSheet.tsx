"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lineTotalMinor, formatMoney } from "@/lib/calculations";

export type DraftItem = {
  description: string;
  quantity: number;
  unitPrice: number; // display units (AED), not minor
  vatExempt: boolean;
};

export function LineItemSheet({
  open,
  onClose,
  item,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  item: DraftItem;
  onSave: (item: DraftItem) => void;
}) {
  const [draft, setDraft] = useState<DraftItem>(item);

  useEffect(() => {
    if (open) setDraft(item);
  }, [open, item]);

  const subtotal = lineTotalMinor({ quantity: draft.quantity, unitPriceMinor: Math.round(draft.unitPrice * 100) });

  return (
    <BottomSheet open={open} onClose={onClose} title="Line Item">
      <div className="space-y-4 pb-2">
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Description</Label>
          <Input
            className="h-11 text-base"
            placeholder="e.g. Trade License Renewal"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Quantity</Label>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              className="h-11 text-base"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: parseInt(e.target.value || "1", 10) })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Unit Price (AED)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="h-11 text-base"
              value={draft.unitPrice}
              onChange={(e) => setDraft({ ...draft, unitPrice: parseFloat(e.target.value || "0") })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="vatExempt"
            checked={draft.vatExempt}
            onChange={(e) => setDraft({ ...draft, vatExempt: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-[#98682E] focus:ring-[#98682E]"
          />
          <Label htmlFor="vatExempt" className="text-sm text-slate-600 cursor-pointer">VAT exempt</Label>
        </div>

        <div className="flex justify-between items-center pt-2 border-t text-sm">
          <span className="text-slate-500">Line Total:</span>
          <span className="font-semibold">{formatMoney(subtotal)}</span>
        </div>

        <button
          type="button"
          disabled={!draft.description.trim()}
          onClick={() => onSave(draft)}
          className="w-full h-12 rounded-xl bg-[#98682E] text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          Save Line Item
        </button>
      </div>
    </BottomSheet>
  );
}
