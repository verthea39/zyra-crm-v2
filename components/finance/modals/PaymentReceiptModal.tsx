import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Client } from "@prisma/client";
import { toast } from "sonner";
import { printDocument } from "@/lib/printUtils";
import { getPendingInvoices } from "@/app/actions/finance";
import { Receipt, X } from "lucide-react";

interface InvoiceOption {
  id: string;
  reference: string;
  amountTotal: number;
  amountPaid: number;
}

export function PaymentReceiptModal({ open, onOpenChange, clients }: { open: boolean; onOpenChange: (open: boolean) => void; clients: Client[] }) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate generation delay
    setTimeout(() => {
      setLoading(false);
      toast.success("Payment Receipt generated successfully!");
      
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient ? selectedClient.name : "Unknown Client";
      const clientPhone = selectedClient?.phone || undefined;
      const clientTRN = undefined;
      const clientDocumentRef = selectedClient?.type === 'CORPORATE' ? selectedClient?.tradeLicenseNo : selectedClient?.passportNo;
      
      const inv = invoices.find(i => i.reference === invoiceRef);
      const previousTotal = inv ? (inv.amountTotal / 100) : undefined;
      const parsedAmount = parseFloat(amount || "0");
      let remainingBalance = undefined;
      if (inv) {
        remainingBalance = ((inv.amountTotal - inv.amountPaid) / 100) - parsedAmount;
      }

      printDocument({
        type: 'PAYMENT_RECEIPT',
        clientName,
        clientPhone,
        clientTRN: clientTRN || undefined,
        clientDocumentRef: clientDocumentRef || undefined,
        date: new Date().toISOString().split('T')[0],
        invoiceRef,
        amount: parsedAmount,
        method,
        previousTotal,
        remainingBalance,
        transactionRef
      });

      onOpenChange(false);
      
      // Reset form
      setClientId("");
      setInvoiceRef("");
      setAmount("");
      setMethod("Bank Transfer");
      setTransactionRef("");
    }, 1000);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount Received (AED) *</Label>
              <Input type="number" inputMode="decimal" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
              <button type="submit" disabled={loading} className="bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all">
                {loading ? "Generating..." : "Save & Generate Receipt"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
