import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Client } from "@prisma/client";
import { toast } from "sonner";
import { printDocument, LineItem } from "@/lib/printUtils";
import { FileSignature, Plus, Trash2, X, ChevronRight, ArrowLeft } from "lucide-react";
import { MobileStepTabs } from "@/components/ui/mobile-step-tabs";
import { LineItemEditorSheet } from "./LineItemEditorSheet";

import { getServiceItems } from "@/app/actions/settings";
import { useEffect } from "react";

const MOBILE_STEPS = ["Client & Dates", "Line Items", "Terms & Notes", "Summary"];

export function QuotationModal({ open, onOpenChange, clients }: { open: boolean; onOpenChange: (open: boolean) => void; clients: Client[] }) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ desc: "", govCost: 0, proFee: 0 }]);
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [mobileStep, setMobileStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setMobileStep(0);
      setFurthestStep(0);
    }
  }, [open]);

  const goToStep = (step: number) => {
    setMobileStep(step);
    setFurthestStep((f) => Math.max(f, step));
  };

  useEffect(() => {
    if (open) {
      getServiceItems().then(data => setDbServices(data));
    }
  }, [open]);

  // Group DB services by category for dropdown
  const groupedServices = dbServices.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push({
      name: curr.name,
      gov: curr.govFee,
      pro: curr.agencyFee
    });
    return acc;
  }, {} as Record<string, any[]>);

  const PRESET_SERVICES = Object.entries(groupedServices).map(([group, items]) => ({
    group,
    items: items as any[]
  }));
  // Ensure "Other" group exists
  if (!PRESET_SERVICES.find(g => g.group === "Other")) {
    PRESET_SERVICES.push({ group: "Other", items: [] });
  }
  const otherGroup = PRESET_SERVICES.find(g => g.group === "Other");
  if (otherGroup && !otherGroup.items.find((i: any) => i.name === "Custom / Other Service")) {
    otherGroup.items.push({ name: "Custom / Other Service", gov: 0, pro: 0 });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate generation delay
    setTimeout(() => {
      setLoading(false);
      toast.success("Quotation generated successfully!");
      
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient ? selectedClient.name : "Unknown Client";
      const clientPhone = selectedClient?.phone || undefined;
      const clientTRN = undefined;
      const clientDocumentRef = selectedClient?.type === 'CORPORATE' ? selectedClient?.tradeLicenseNo : selectedClient?.passportNo;
      
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const qtReference = `QT-${year}-${randomSeq}`;

      const govFeeNum = items.reduce((sum, item) => sum + item.govCost, 0);
      const proFeeNum = items.reduce((sum, item) => sum + item.proFee, 0);

      printDocument({
        type: 'QUOTATION',
        clientName,
        clientPhone,
        clientTRN: clientTRN || undefined,
        clientDocumentRef: clientDocumentRef || undefined,
        reference: qtReference,
        date: new Date().toISOString().split('T')[0],
        govCost: govFeeNum,
        proFee: proFeeNum,
        total: govFeeNum + proFeeNum,
        expiry,
        notes,
        lineItems: items
      });

      onOpenChange(false);
      
      // Reset form
      setClientId("");
      setItems([{ desc: "", govCost: 0, proFee: 0 }]);
      setExpiry("");
      setNotes("");
    }, 1000);
  };

  const govFeeNum = items.reduce((sum, item) => sum + item.govCost, 0);
  const proFeeNum = items.reduce((sum, item) => sum + item.proFee, 0);
  const total = (govFeeNum + proFeeNum).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 sm:rounded-2xl rounded-none bg-white border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="bg-white border-b border-slate-200 p-5 sm:p-6 sm:rounded-t-2xl shrink-0 relative">
          <button onClick={() => onOpenChange(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] p-2.5 rounded-xl flex items-center justify-center">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Generate Quotation</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Create a professional quotation with split government and service fees.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <MobileStepTabs steps={MOBILE_STEPS} activeStep={mobileStep} furthestStep={furthestStep} onStepClick={goToStep} />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:px-2 flex flex-col gap-5">
          <div className={`${mobileStep === 0 ? "block" : "hidden"} sm:block space-y-2`}>
            <Label>Select Client *</Label>
            <select
              required
              className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.type === 'CORPORATE' ? '(B2B)' : '(B2C)'}</option>
              ))}
            </select>
          </div>

          {/* Expiry moved up for mobile Step 1 "Client & Dates" */}
          <div className="sm:hidden">
            {mobileStep === 0 && (
              <div className="space-y-2">
                <Label>Validity / Expiry Date</Label>
                <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            )}
          </div>

          <div className={`${mobileStep === 1 ? "block" : "hidden"} sm:block bg-white rounded-lg border p-1 sm:p-1 overflow-hidden`}>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Service Description</th>
                    <th className="px-3 py-2.5 font-medium w-32 text-right">Gov Fee (AED)</th>
                    <th className="px-3 py-2.5 font-medium w-32 text-right">Zyra Fee (AED)</th>
                    <th className="px-3 py-2.5 font-medium w-32 text-right">Subtotal</th>
                    <th className="px-2 py-2.5 font-medium w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2 align-top">
                        <select
                          className="w-full h-9 text-sm border border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] bg-white px-3"
                          value={
                            PRESET_SERVICES.flatMap(g => g.items).some(i => i.name === item.desc && i.name !== "Custom / Other Service") 
                              ? item.desc 
                              : (item.desc === "" ? "" : "Custom / Other Service")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const newItems = [...items];
                            if (val === "Custom / Other Service") {
                              newItems[idx].desc = "Custom Service Details";
                              newItems[idx].govCost = 0;
                              newItems[idx].proFee = 0;
                            } else {
                              newItems[idx].desc = val;
                              const preset = PRESET_SERVICES.flatMap(g => g.items).find(i => i.name === val);
                              if (preset) {
                                newItems[idx].govCost = preset.gov;
                                newItems[idx].proFee = preset.pro;
                              }
                            }
                            setItems(newItems);
                          }}
                        >
                          <option value="" disabled>-- Select Service --</option>
                          {PRESET_SERVICES.map(g => (
                            <optgroup key={g.group} label={g.group}>
                              {g.items.map(i => (
                                <option key={i.name} value={i.name}>{i.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        {(!PRESET_SERVICES.flatMap(g => g.items).some(i => i.name === item.desc && i.name !== "Custom / Other Service") && item.desc !== "") && (
                          <Input 
                            className="mt-2 h-9 text-sm border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]" 
                            placeholder="Type custom description..."
                            value={item.desc === "Custom Service Details" ? "" : item.desc}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].desc = e.target.value || "Custom Service Details";
                              setItems(newItems);
                            }}
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <Input 
                          type="number" 
                          inputMode="decimal"
                          required 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 text-sm text-right border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]" 
                          value={item.govCost === 0 && item.desc === "Custom Service Details" ? '' : item.govCost}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].govCost = parseFloat(e.target.value || "0");
                            setItems(newItems);
                          }}
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <Input 
                          type="number" 
                          inputMode="decimal"
                          required 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 text-sm text-right border-slate-200 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]" 
                          value={item.proFee === 0 && item.desc === "Custom Service Details" ? '' : item.proFee}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].proFee = parseFloat(e.target.value || "0");
                            setItems(newItems);
                          }}
                        />
                      </td>
                      <td className="px-2 py-2 align-top font-semibold text-slate-800 text-right pr-2 pt-4">
                        {(item.govCost + item.proFee).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 align-top text-center pt-3.5">
                        {items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newItems = items.filter((_, i) => i !== idx);
                              setItems(newItems);
                            }}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile: collapsed cards, tap to edit in a bottom sheet */}
            <div className="sm:hidden flex flex-col gap-2 p-2">
              {items.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setEditingIdx(idx)}
                  className="flex items-center justify-between gap-3 bg-slate-50 border rounded-xl p-3.5 text-left active:scale-[0.98] transition-transform min-h-[44px]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.desc === "Custom Service Details" ? "Custom Service" : (item.desc || "Tap to select a service")}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">AED {(item.govCost + item.proFee).toFixed(2)}</p>
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
            </div>

            {/* Desktop: inline add */}
            <div className="hidden sm:flex p-3 bg-white border-t border-slate-100 justify-center">
              <button
                type="button"
                onClick={() => setItems([...items, { desc: "", govCost: 0, proFee: 0 }])}
                className="bg-[#FDF8F0] hover:bg-[#F7EEDB] border border-[#EADBC8] text-[#98682E] font-medium text-xs rounded-xl py-2 px-3.5 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Service
              </button>
            </div>

            {/* Mobile: add opens bottom sheet */}
            <div className="sm:hidden p-2 pt-0">
              <button
                type="button"
                onClick={() => {
                  setItems([...items, { desc: "", govCost: 0, proFee: 0 }]);
                  setEditingIdx(items.length);
                }}
                className="w-full h-11 bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" /> Add Service Line
              </button>
            </div>
          </div>

          <LineItemEditorSheet
            open={editingIdx !== null}
            onClose={() => {
              if (editingIdx !== null && items[editingIdx] && !items[editingIdx].desc) {
                setItems(items.filter((_, i) => i !== editingIdx));
              }
              setEditingIdx(null);
            }}
            item={editingIdx !== null ? items[editingIdx] : { desc: "", govCost: 0, proFee: 0 }}
            onSave={(updated) => {
              if (editingIdx === null) return;
              const newItems = [...items];
              newItems[editingIdx] = updated;
              setItems(newItems);
              setEditingIdx(null);
            }}
            presetServices={PRESET_SERVICES}
            proFeeLabel="Zyra Fee (AED)"
            proFeeColorClass="text-blue-600"
            proFeeBorderClass="border-blue-200"
          />

          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Validity / Expiry Date</Label>
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" />
            </div>
          </div>

          {/* Mobile Step 3 "Terms & Notes" */}
          {mobileStep === 2 && (
            <div className="sm:hidden space-y-2">
              <Label>Internal Notes</Label>
              <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" />
            </div>
          )}

          {/* Sticky Footer for Totals & Action */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-5 bg-white border-t border-slate-200 space-y-4 z-10 pb-safe sm:rounded-b-2xl">
            {/* Full breakdown: always on desktop, mobile only on final step */}
            <div className={`${mobileStep === 3 ? "block" : "hidden"} sm:block bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm`}>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subtotal Government Pass-Through</span>
                <span className="font-semibold text-slate-700">AED {govFeeNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subtotal Professional Service Fee</span>
                <span className="font-semibold text-slate-700">AED {proFeeNum.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Total Quotation Value</span>
                <span className="text-xl font-bold text-slate-900">AED {total}</span>
              </div>
            </div>

            {/* Mini running-total bar: mobile steps 0-2 only */}
            {mobileStep < 3 && (
              <div className="sm:hidden flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 font-medium">Total Quotation Value</span>
                <span className="text-lg font-bold text-slate-900">AED {total}</span>
              </div>
            )}

            {/* Desktop actions */}
            <div className="hidden sm:flex justify-end gap-3 pt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => onOpenChange(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all">
                {loading ? "Generating..." : "Save & Generate PDF"}
              </button>
            </div>

            {/* Mobile step navigation */}
            <div className="sm:hidden flex gap-3">
              {mobileStep > 0 && (
                <button
                  type="button"
                  onClick={() => setMobileStep(mobileStep - 1)}
                  className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {mobileStep < 3 ? (
                <button
                  type="button"
                  onClick={() => goToStep(mobileStep + 1)}
                  disabled={mobileStep === 0 && !clientId}
                  className="flex-1 h-12 rounded-xl bg-[#98682E] text-white font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-[#007A55] text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Create Quotation"}
                </button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
