import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Client } from "@prisma/client";
import { toast } from "sonner";
import { downloadDocumentPDF, printViaIframe } from "@/lib/printUtils";
import type { CompanyBranding } from "@/lib/companyBranding";
import { getBranding } from "@/app/actions/branding";
import { getPendingInvoices, recordPayment } from "@/app/actions/finance";
import { Receipt, X } from "lucide-react";

interface InvoiceOption {
  id: string;
  reference: string;
  amountTotal: number;
  amountPaid: number;
}

export function PaymentReceiptModal({ open, onOpenChange, clients }: { open: boolean; onOpenChange: (open: boolean) => void; clients: Client[] }) {
  const [loading, setLoading] = useState<false | "saving" | "pdf">(false);
  const [clientId, setClientId] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);

  useEffect(() => {
    if (open) getBranding().then(setBranding);
  }, [open]);

  useEffect(() => {
    if (clientId) {
      setFetchingInvoices(true);
      getPendingInvoices(clientId).then(data => {
        setInvoices(data);
        setInvoiceRef("");
        setAmount("");
        setFetchingInvoices(false);
      });
    } else {
      setInvoices([]);
      setInvoiceRef("");
      setAmount("");
    }
  }, [clientId]);

  const selectedInvoice = invoices.find(i => i.reference === invoiceRef);
  const remainingBalanceAed = selectedInvoice ? (selectedInvoice.amountTotal - selectedInvoice.amountPaid) / 100 : undefined;

  const handleInvoiceChange = (ref: string) => {
    setInvoiceRef(ref);
    const inv = invoices.find(i => i.reference === ref);
    if (inv) {
      const remaining = (inv.amountTotal - inv.amountPaid) / 100;
      setAmount(remaining.toFixed(2));
    } else {
      setAmount("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount || "0");
    if (selectedInvoice && remainingBalanceAed !== undefined && parsedAmount > remainingBalanceAed + 0.001) {
      toast.error(`Amount exceeds the remaining balance of AED ${remainingBalanceAed.toFixed(2)}.`);
      return;
    }

    setLoading("saving");

    try {
      // Actually apply the payment to the invoice (this used to only generate
      // a PDF and never touched the database at all -- amountPaid/status on
      // the linked Transaction never changed no matter how many "receipts"
      // were printed).
      let newBalance: number | undefined = undefined;
      if (selectedInvoice) {
        const res = await recordPayment({
          transactionId: selectedInvoice.id,
          amount: parsedAmount,
          method,
          transactionRef: transactionRef || undefined,
        });
        if (!res.success) {
          setLoading(false);
          toast.error(res.error || "Failed to record payment");
          return;
        }
        newBalance = (res.remainingBalance ?? 0) / 100;
      }

      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient ? selectedClient.name : "Unknown Client";
      const clientPhone = selectedClient?.phone || undefined;
      const clientTRN = undefined;
      const clientDocumentRef = selectedClient?.type === 'CORPORATE' ? selectedClient?.tradeLicenseNo : selectedClient?.passportNo;
      const clientEmail = selectedClient?.email || undefined;

      const previousTotal = selectedInvoice ? (selectedInvoice.amountTotal / 100) : undefined;

      const printPayload = {
        type: 'PAYMENT_RECEIPT' as const,
        clientName,
        clientPhone,
        clientEmail,
        clientTRN: clientTRN || undefined,
        clientDocumentRef: clientDocumentRef || undefined,
        date: new Date().toISOString().split('T')[0],
        invoiceRef,
        amount: parsedAmount,
        method,
        previousTotal,
        remainingBalance: newBalance,
        transactionRef
      };

      toast.success(
        selectedInvoice
          ? `Payment recorded. Balance due: AED ${(newBalance ?? 0).toFixed(2)}`
          : "Payment Receipt generated successfully!"
      );

      setLoading("pdf");
      try {
        await downloadDocumentPDF(printPayload, branding ?? undefined);
      } catch (pdfErr) {
        console.error("PDF generation failed:", pdfErr);
        toast.error("Payment recorded, but PDF download failed. Use Print instead.", {
          action: { label: "Print", onClick: () => printViaIframe(printPayload, branding ?? undefined) },
        });
      }

      setLoading(false);
      onOpenChange(false);

      // Reset form
      setClientId("");
      setInvoiceRef("");
      setAmount("");
      setMethod("Bank Transfer");
      setTransactionRef("");
    } catch (err) {
      console.error("Failed to record payment:", err);
      setLoading(false);
      toast.error("An error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 sm:rounded-2xl rounded-none bg-white border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="bg-white border-b border-slate-200 p-5 sm:p-6 sm:rounded-t-2xl shrink-0 relative">
          <button onClick={() => onOpenChange(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] p-2.5 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Payment Receipt</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Acknowledge incoming client payments.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:px-2 flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Select Client *</Label>
            <select 
              required
              className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Link to Invoice / Reference</Label>
            {invoices.length > 0 ? (
              <select 
                className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                value={invoiceRef}
                onChange={(e) => handleInvoiceChange(e.target.value)}
              >
                <option value="">-- Select Pending Invoice --</option>
                {invoices.map(inv => {
                  const remaining = ((inv.amountTotal - inv.amountPaid) / 100).toFixed(2);
                  return (
                    <option key={inv.id} value={inv.reference}>
                      {inv.reference} (Balance: AED {remaining})
                    </option>
                  )
                })}
              </select>
            ) : (
              <Input type="text" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder={fetchingInvoices ? "Loading invoices..." : "e.g. INV-2026-042"} disabled={fetchingInvoices} />
            )}
          </div>

          {selectedInvoice && (
            <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Amount</p>
                <p className="text-sm font-bold text-slate-900">AED {(selectedInvoice.amountTotal / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Paid</p>
                <p className="text-sm font-bold text-emerald-600">AED {(selectedInvoice.amountPaid / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Balance Due</p>
                <p className="text-sm font-bold text-rose-600">AED {(remainingBalanceAed ?? 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount Received (AED) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                required
                min="0.01"
                max={remainingBalanceAed ?? undefined}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {remainingBalanceAed !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Enter any amount up to AED {remainingBalanceAed.toFixed(2)} -- partial payments are allowed.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <select 
                required
                className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card/POS">Card / POS</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Transaction / Cheque Ref</Label>
            <Input type="text" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="e.g. TRN-998822" />
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-5 bg-white border-t border-slate-200 mt-auto z-10 pb-safe sm:rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => onOpenChange(false)}>Cancel</button>
              <button type="submit" disabled={!!loading} className="bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all disabled:opacity-60">
                {loading === "pdf" ? "Generating PDF..." : loading === "saving" ? "Saving..." : "Save & Generate Receipt"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
