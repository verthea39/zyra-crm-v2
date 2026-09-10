"use client";

import { useState, useEffect } from "react";
import { getReferenceDataAction, updatePaymentAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export default function EditPaymentModal({ isOpen, onClose, payment }: EditPaymentModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [chequeNo, setChequeNo] = useState("");

  useEffect(() => {
    if (isOpen && payment) {
      setIsLoading(true);
      setError(null);
      
      setAmount((Number(payment.amountFils) / 100).toString());
      setDate(new Date(payment.occurredAt).toISOString().split("T")[0]);
      setAccountId(payment.accountId || "");
      setPaymentMode(payment.mode || "CASH");
      setNotes(payment.notes || "");
      setChequeNo(payment.chequeNo || "");

      getReferenceDataAction().then((res) => {
        if (res.success) {
          setAccounts(res.data.accounts);
        } else {
          setError("Failed to load accounts.");
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      occurredAt: new Date(date),
      mode: paymentMode,
      accountId,
      amountAed: parseFloat(amount),
      notes: notes || undefined,
      chequeNo: chequeNo || undefined,
    };

    const res = await updatePaymentAction(payment.id, payload);
    
    setIsSubmitting(false);
    
    if (res.success) {
      onClose();
      window.location.reload(); // Refresh to update the table state
    } else {
      setError(res.error || "An error occurred while updating the payment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Payment</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 overflow-y-auto space-y-4">
              
              <div className="bg-muted/30 p-3 rounded-md text-sm border border-border/50">
                <span className="text-muted-foreground">Reference:</span> <strong className="ml-1">{payment.reference}</strong>
              </div>

              {error && (
                <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount (AED) <span className="text-rose-500">*</span></label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">Amount cannot be less than what is already allocated to invoices.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date <span className="text-rose-500">*</span></label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Mode</label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PORTAL_BALANCE">Portal Balance</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              {paymentMode === "CHEQUE" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Cheque No</label>
                  <Input 
                    type="text" 
                    value={chequeNo} 
                    onChange={e => setChequeNo(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Account <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                >
                  <option value="" disabled>Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input 
                  type="text" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

            </div>
            
            <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
