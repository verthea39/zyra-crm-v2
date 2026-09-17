"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCombobox } from "./ServiceCombobox";
import type { LineItem } from "@/lib/printUtils";

type ServiceGroup = { group: string; items: { name: string; gov: number; pro: number }[] };

export function LineItemEditorSheet({
  open,
  onClose,
  item,
  onSave,
  presetServices,
  proFeeLabel = "Service Fee (AED)",
  proFeeColorClass = "text-emerald-600",
  proFeeBorderClass = "border-emerald-200",
}: {
  open: boolean;
  onClose: () => void;
  item: LineItem;
  onSave: (item: LineItem, addAnother?: boolean) => void;
  presetServices: ServiceGroup[];
  proFeeLabel?: string;
  proFeeColorClass?: string;
  proFeeBorderClass?: string;
}) {
  // Parent should pass a `key` that changes per-item so this remounts fresh
  // instead of relying on an effect to sync state from a prop.
  const [draft, setDraft] = useState<LineItem>(item);

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Service Line">
      <div className="space-y-4 pb-2">
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Service Description</Label>
          <ServiceCombobox
            presetServices={presetServices}
            value={draft.desc}
            inputClassName="h-11 text-base"
            placeholder="Search or type a service..."
            onSelect={(service) => setDraft({ ...draft, desc: service.name, govCost: service.gov, proFee: service.pro })}
            onChangeText={(text) => setDraft({ ...draft, desc: text })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Gov Fee (AED)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="h-11 text-base"
              value={draft.govCost === 0 && draft.desc === "Custom Service Details" ? "" : draft.govCost}
              onChange={(e) => setDraft({ ...draft, govCost: parseFloat(e.target.value || "0") })}
            />
          </div>
          <div className="space-y-1">
            <Label className={`text-xs ${proFeeColorClass}`}>{proFeeLabel}</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`h-11 text-base ${proFeeBorderClass}`}
              value={draft.proFee === 0 && draft.desc === "Custom Service Details" ? "" : draft.proFee}
              onChange={(e) => setDraft({ ...draft, proFee: parseFloat(e.target.value || "0") })}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t text-sm">
          <span className="text-slate-500">Row Subtotal:</span>
          <span className="font-semibold">AED {(draft.govCost + draft.proFee).toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!draft.desc}
            onClick={() => onSave(draft)}
            className="flex-1 h-12 rounded-xl bg-[#98682E] text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            Save Line Item
          </button>
          <button
            type="button"
            disabled={!draft.desc}
            onClick={() => onSave(draft, true)}
            className="flex-1 h-12 rounded-xl border border-[#98682E] text-[#98682E] font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            Save & Add Another
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
