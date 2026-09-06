"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuotation } from "@/lib/actions/quotations";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAED } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
type LineItemType = "AGENCY_SERVICE_FEE" | "GOVERNMENT_CHARGE";

interface LineItem {
  description: string;
  type: LineItemType;
  quantity: number;
  unitPrice: number;
  govReceiptRef?: string;
}

const emptyLine: LineItem = {
  description: "",
  type: "AGENCY_SERVICE_FEE",
  quantity: 1,
  unitPrice: 0,
  govReceiptRef: "",
};

export function QuotationBuilder({
  clients,
  services = [],
}: {
  clients: { id: string; label: string }[];
  services?: any[];
}) {
  const [clientId, setClientId] = useState("");
  
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLine }]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const totals = useMemo(() => calculateInvoiceTotals(lineItems), [lineItems]);

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, ...patch } : li)));
  }

  function addLine() {
    setLineItems((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("lineItemsJson", JSON.stringify(lineItems));
    
    await createQuotation(formData);
    
    // Server action redirects, this is a fallback only.
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Prepare for</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Client</Label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="" disabled>
                Select a client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Line items</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((li, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-4">
                <Label className="text-xs">Description</Label>
                <Input
                  list={`services-list-${i}`}
                  value={li.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = services.find((s) => s.name === val);
                    if (matched) {
                      updateLine(i, { 
                        description: val, 
                        unitPrice: Number(matched.basePrice) || 0,
                        type: "AGENCY_SERVICE_FEE" 
                      });
                    } else {
                      updateLine(i, { description: val });
                    }
                  }}
                  placeholder="e.g. Visa Processing"
                  required
                />
                <datalist id={`services-list-${i}`}>
                  {services.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-3">
                <Label className="text-xs">Type</Label>
                <Select
                  value={li.type}
                  onChange={(e) => updateLine(i, { type: e.target.value as LineItemType })}
                >
                  <option value="AGENCY_SERVICE_FEE">Agency Service Fee (5% VAT)</option>
                  <option value="GOVERNMENT_CHARGE">Government Charge (Estimated, 0% VAT)</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={li.quantity}
                  onChange={(e) => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Unit price (AED)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={li.unitPrice}
                  onChange={(e) => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(i)}
                  disabled={lineItems.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <TotalRow label="Subtotal (Taxable Service Fees)" value={totals.subtotalServiceFees} />
          <TotalRow label="VAT (5% on taxable lines only)" value={totals.vatAmount} />
          <TotalRow
            label="Subtotal (Government Disbursements, 0% VAT)"
            value={totals.subtotalGovDisbursements}
          />
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total Estimated (AED)</span>
            <span>{formatAED(totals.totalPayable)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !clientId}>
          {submitting ? "Saving…" : "Create Quotation"}
        </Button>
      </div>
    </form>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{formatAED(value)}</span>
    </div>
  );
}
