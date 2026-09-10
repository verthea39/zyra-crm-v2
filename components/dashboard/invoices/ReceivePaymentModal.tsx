"use client";

import { useState, useEffect } from "react";
import { getReferenceDataAction, recordPaymentAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function ReceivePaymentModal({ isOpen, onClose, transaction }: ReceivePaymentModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && transaction) {
      setIsLoading(true);
      setError(null);
      
      const billedFils = Number(transaction.amountFils) + Number(transaction.taxFils);
      const settledFils = Number(transaction.settledFils);
      const balanceFils = billedFils - settledFils;
      setAmount((balanceFils / 100).toString());
      setDate(new Date().toISOString().split("T")[0]);
      setNotes(`Payment for ${transaction.reference}`);

      getReferenceDataAction().then((res) => {
        if (res.success) {
          setAccounts(res.data.accounts);
          if (res.data.accounts?.length > 0) {
            setAccountId(res.data.accounts[0].id);
          }
        } else {
          setError("Failed to load accounts.");
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

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
      direction: "IN",
      occurredAt: new Date(date),
      mode: paymentMode,
      accountId,
      clientId: transaction.clientId,
      amountAed: parseFloat(amount),
      notes: notes || undefined,
      allocations: [{ transactionId: transaction.id, amountAed: parseFloat(amount) }]
    };

    const res = await recordPaymentAction(payload);
    
    setIsSubmitting(false);
    
    if (res.success) {
      onClose();
      window.location.reload(); // Refresh to update the table state
    } else {
      setError(res.error || "An error occurred while recording payment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-emerald-600">Receive Payment</h2>
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
                <span className="text-muted-foreground">Invoice:</span> <strong className="ml-1">{transaction.reference}</strong>
              </div>

              {error && (
                <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount Received (AED) <span className="text-rose-500">*</span></label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                />
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
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : "Record Payment"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
