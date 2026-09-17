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
  proFeeLabel = "Service Charge (AED)",
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
            // Gov Fee + Service Fee are merged into a single amount now --
            // the preset's combined total goes into proFee, govCost stays 0
            // so schema/VAT calc (which reads proFee as the taxable amount)
            // keeps working unchanged.
            onSelect={(service) => setDraft({ ...draft, desc: service.name, govCost: 0, proFee: service.gov + service.pro })}
            onChangeText={(text) => setDraft({ ...draft, desc: text })}
          />
        </div>

        <div className="space-y-1">
          <Label className={`text-xs ${proFeeColorClass}`}>{proFeeLabel} *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">AED</span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`h-11 text-base pl-12 ${proFeeBorderClass}`}
              value={draft.proFee === 0 && draft.desc === "Custom Service Details" ? "" : draft.proFee}
              onChange={(e) => setDraft({ ...draft, govCost: 0, proFee: parseFloat(e.target.value || "0") })}
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
