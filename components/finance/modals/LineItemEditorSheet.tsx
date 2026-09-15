"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onSave: (item: LineItem) => void;
  presetServices: ServiceGroup[];
  proFeeLabel?: string;
  proFeeColorClass?: string;
  proFeeBorderClass?: string;
}) {
  // Parent should pass a `key` that changes per-item so this remounts fresh
  // instead of relying on an effect to sync state from a prop.
  const [draft, setDraft] = useState<LineItem>(item);

  const allPresets = presetServices.flatMap((g) => g.items);
  const isCustom = draft.desc !== "" && !allPresets.some((i) => i.name === draft.desc && i.name !== "Custom / Other Service");

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Service Line">
      <div className="space-y-4 pb-2">
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Service Description</Label>
          <select
            className="w-full h-11 text-base border border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] bg-white px-3"
            value={
              allPresets.some((i) => i.name === draft.desc && i.name !== "Custom / Other Service")
                ? draft.desc
                : draft.desc === "" ? "" : "Custom / Other Service"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Custom / Other Service") {
                setDraft({ ...draft, desc: "Custom Service Details", govCost: 0, proFee: 0 });
              } else {
                const preset = allPresets.find((i) => i.name === val);
                setDraft({
                  ...draft,
                  desc: val,
                  govCost: preset ? preset.gov : draft.govCost,
                  proFee: preset ? preset.pro : draft.proFee,
                });
              }
            }}
          >
            <option value="" disabled>-- Select Service --</option>
            {presetServices.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map((i) => (
                  <option key={i.name} value={i.name}>{i.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {isCustom && (
            <Input
              className="h-11 text-base"
              placeholder="Type custom description..."
              value={draft.desc === "Custom Service Details" ? "" : draft.desc}
              onChange={(e) => setDraft({ ...draft, desc: e.target.value || "Custom Service Details" })}
            />
          )}
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

        <button
          type="button"
          disabled={!draft.desc}
          onClick={() => onSave(draft)}
          className="w-full h-12 rounded-xl bg-[#98682E] text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          Save Line Item
        </button>
      </div>
    </BottomSheet>
  );
}
