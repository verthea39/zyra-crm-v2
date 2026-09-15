"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MobileStepTabs } from "@/components/ui/mobile-step-tabs";
import { LineItemSheet, DraftItem } from "./LineItemSheet";
import { createDocument, updateDocument } from "@/app/actions/documents";
import { calculateDocumentTotals, formatMoney, DEFAULT_VAT_RATE, minorToDisplay } from "@/lib/calculations";
import { Plus, Trash2, ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAddClientModal } from "@/components/finance/modals/QuickAddClientModal";
import { QuickPasteDialog } from "@/components/finance/modals/QuickPasteDialog";
import type { ParsedLineItem } from "@/lib/quickPasteParser";

const STEPS = ["Client Info", "Items & VAT", "Review"];

export type DocumentWizardInitialData = {
  id: string;
  type: "INVOICE" | "QUOTATION" | "RECEIPT";
  clientId: string;
  dueDate?: string | null;
  expiryDate?: string | null;
  discountMinor: number;
  vatRate: number;
  notes?: string | null;
  items: { description: string; quantity: number; unitPriceMinor: number; vatExempt: boolean }[];
};

export function DocumentWizard({ clients, defaultType = "INVOICE", initialData }: {
  clients: { id: string; name: string }[];
  defaultType?: "INVOICE" | "QUOTATION" | "RECEIPT";
  initialData?: DocumentWizardInitialData;
}) {
  const router = useRouter();
  const isEditMode = !!initialData;
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<"INVOICE" | "QUOTATION" | "RECEIPT">(initialData?.type ?? defaultType);
  const [clientId, setClientId] = useState(initialData?.clientId ?? "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.slice(0, 10) : "");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ? initialData.expiryDate.slice(0, 10) : "");

  const [items, setItems] = useState<DraftItem[]>(
    initialData?.items.length
      ? initialData.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: minorToDisplay(i.unitPriceMinor),
          vatExempt: i.vatExempt,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, vatExempt: false }]
  );
  const [discount, setDiscount] = useState(initialData ? minorToDisplay(initialData.discountMinor) : 0);
  const [vatRate, setVatRate] = useState(initialData?.vatRate ?? DEFAULT_VAT_RATE);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localClients, setLocalClients] = useState<{ id: string; name: string }[]>(clients);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickPasteOpen, setQuickPasteOpen] = useState(false);

  const handleQuickPasteInsert = (parsedItems: ParsedLineItem[], parsedClientName: string | null) => {
    const newLineItems: DraftItem[] = parsedItems.map((i) => ({
      description: i.description,
      quantity: 1,
      unitPrice: i.price,
      vatExempt: false,
    }));
    setItems((prev) => {
      const cleaned = prev.filter((p) => p.description.trim() !== "" || p.unitPrice > 0);
      return [...cleaned, ...newLineItems];
    });

    if (parsedClientName && !clientId) {
      const needle = parsedClientName.toLowerCase();
      const match = localClients.find(
        (c) => c.name.toLowerCase().includes(needle) || needle.includes(c.name.toLowerCase())
      );
      if (match) {
        setClientId(match.id);
        toast.success(`Matched client: ${match.name}`);
      } else {
        toast.info(`Extracted client "${parsedClientName}" -- no match found, please select manually.`);
      }
    }

    toast.success(`Successfully imported ${parsedItems.length} items`);
  };

  const goToStep = (s: number) => {
    setStep(s);
    setFurthestStep((f) => Math.max(f, s));
  };

  const calcItems = items
    .filter((i) => i.description.trim())
    .map((i) => ({ quantity: i.quantity, unitPriceMinor: Math.round(i.unitPrice * 100), vatExempt: i.vatExempt }));
  const totals = calculateDocumentTotals(calcItems, { discountMinor: Math.round(discount * 100), vatRate });

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      clientId,
      items: items
        .filter((i) => i.description.trim())
        .map((i) => ({ description: i.description, quantity: i.quantity, unitPriceMinor: Math.round(i.unitPrice * 100), vatExempt: i.vatExempt })),
      discountMinor: Math.round(discount * 100),
      vatRate,
      dueDate: dueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes,
    };

    const res = isEditMode
      ? await updateDocument(initialData!.id, payload)
      : await createDocument({ ...payload, type });
    setLoading(false);

    if (res.success) {
      toast.success(`${type.charAt(0) + type.slice(1).toLowerCase()} ${isEditMode ? "updated" : "created"}`);
      router.push(isEditMode ? `/documents/${initialData!.id}` : "/documents");
      router.refresh();
    } else {
      toast.error(res.error || `Failed to ${isEditMode ? "update" : "create"} document`);
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-lg font-semibold sm:text-2xl text-foreground">
          {isEditMode ? `Edit ${type.charAt(0) + type.slice(1).toLowerCase()}` : "New Document"}
        </h1>
        {isEditMode ? (
          <span className="w-full md:w-auto h-11 flex items-center px-3 rounded-md border border-input bg-slate-50 text-base text-slate-600">
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </span>
        ) : (
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "INVOICE" | "QUOTATION" | "RECEIPT")}
            className="w-full md:w-auto h-11 rounded-md border border-input bg-background px-3 text-base"
          >
            <option value="INVOICE">Invoice</option>
            <option value="QUOTATION">Quotation</option>
            <option value="RECEIPT">Receipt</option>
          </select>
        )}
      </div>

      <MobileStepTabs steps={STEPS} activeStep={step} furthestStep={furthestStep} onStepClick={goToStep} />

      <div className="hidden md:flex gap-2 mb-4">
        {STEPS.map((label, idx) => (
          <button
            key={label}
            onClick={() => idx <= furthestStep && goToStep(idx)}
            className={`px-4 h-9 rounded-full text-sm font-semibold ${idx === step ? "bg-[#98682E] text-white" : "bg-slate-100 text-slate-500"}`}
          >
            {idx + 1}. {label}
          </button>
        ))}
      </div>

      <div className="flex-1 pb-32">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2 w-full">
              <Label>Select Client *</Label>
              <div className="flex gap-2">
                <select
                  required
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">-- Choose Client --</option>
                  {localClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 h-11 px-3"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Add Client</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="space-y-2 w-full">
                <Label>Due Date</Label>
                <Input type="date" className="w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2 w-full">
                <Label>Expiry Date</Label>
                <Input type="date" className="w-full" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {items.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setEditingIdx(idx)}
                  className="w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-xl p-3.5 text-left active:scale-[0.98] transition-transform min-h-[44px]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.description || "Tap to add details"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.quantity} x {formatMoney(Math.round(item.unitPrice * 100))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {items.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItems(items.filter((_, i) => i !== idx));
                        }}
                        className="flex items-center justify-center w-11 h-11 -my-2 rounded-full text-slate-400 active:scale-95 active:bg-rose-50 active:text-rose-500 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatExempt: false }]);
                  setEditingIdx(items.length);
                }}
                className="w-full h-11 bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
              <button
                type="button"
                onClick={() => setQuickPasteOpen(true)}
                className="w-full h-11 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Zap className="w-4 h-4 text-[#98682E]" /> Quick Paste / Import from Text
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="space-y-2 w-full">
                <Label>Discount (AED)</Label>
                <Input type="number" inputMode="decimal" min="0" step="0.01" className="w-full" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value || "0"))} />
              </div>
              <div className="space-y-2 w-full">
                <Label>VAT Rate (%)</Label>
                <Input type="number" inputMode="decimal" min="0" step="0.5" className="w-full" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value || "0"))} />
              </div>
            </div>

            <LineItemSheet
              key={editingIdx ?? "none"}
              open={editingIdx !== null}
              onClose={() => {
                if (editingIdx !== null && items[editingIdx] && !items[editingIdx].description.trim()) {
                  setItems(items.filter((_, i) => i !== editingIdx));
                }
                setEditingIdx(null);
              }}
              item={editingIdx !== null ? items[editingIdx] : { description: "", quantity: 1, unitPrice: 0, vatExempt: false }}
              onSave={(updated) => {
                if (editingIdx === null) return;
                const newItems = [...items];
                newItems[editingIdx] = updated;
                setItems(newItems);
                setEditingIdx(null);
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2 w-full">
              <Label>Notes</Label>
              <Input className="w-full" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" />
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatMoney(totals.subtotalMinor)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Discount</span><span className="font-semibold">-{formatMoney(totals.discountMinor)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">VAT ({vatRate}%)</span><span className="font-semibold">{formatMoney(totals.vatMinor)}</span></div>
              <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Grand Total</span>
                <span className="text-xl font-bold text-slate-900">{formatMoney(totals.totalMinor)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:static bg-white border-t border-slate-200 p-4 pb-safe md:pb-4 md:rounded-b-2xl z-20">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">Grand Total</p>
            <p className="text-lg font-bold text-slate-900 truncate">{formatMoney(totals.totalMinor)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                disabled={step === 0 && !clientId}
                className="h-11 px-5 rounded-xl bg-[#98682E] text-white font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="h-11 px-5 rounded-xl bg-[#007A55] text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Document"}
              </button>
            )}
          </div>
        </div>
      </div>

      <QuickAddClientModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={(client) => {
          setLocalClients((prev) => [...prev, { id: client.id, name: client.name }]);
          setClientId(client.id);
        }}
      />
      <QuickPasteDialog open={quickPasteOpen} onOpenChange={setQuickPasteOpen} onInsert={handleQuickPasteInsert} />
    </div>
  );
}
