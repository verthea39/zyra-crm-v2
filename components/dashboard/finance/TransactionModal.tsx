"use client";

import { useState, useEffect } from "react";
import { getReferenceDataAction, createTransactionAction, updateTransactionAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  direction: "INCOME" | "EXPENSE";
  transaction?: any;
}

export default function TransactionModal({ isOpen, onClose, direction, transaction }: TransactionModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [clientId, setClientId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  
  // Payment state
  const [isPaidNow, setIsPaidNow] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getReferenceDataAction().then((res) => {
        if (res.success) {
          setClients(res.data.clients);
          setAccounts(res.data.accounts);
          
          if (transaction) {
            setAmount((Number(transaction.amountFils) / 100).toString());
            setDate(new Date(transaction.occurredAt).toISOString().split("T")[0]);
            setClientId(transaction.clientId || "");
            setVendorName(transaction.vendorName || "");
            setDescription(transaction.description || "");
            setIsPaidNow(false);
          } else {
            // Auto-select first account if available
            if (res.data.accounts?.length > 0) setAccountId(res.data.accounts[0].id);
            
            setAmount("");
            setDate(new Date().toISOString().split("T")[0]);
            setClientId("");
            setVendorName("");
            setDescription("");
            setIsPaidNow(false);
            setPaidAmount("");
          }
        } else {
          setError("Failed to load reference data.");
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, direction, transaction]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Explicit manual validation
    if (direction === "INCOME" && !clientId) {
      setError("Please select a client.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (isPaidNow) {
      if (!paidAmount || parseFloat(paidAmount) <= 0) {
        setError("Please enter a valid amount paid.");
        return;
      }
      if (!accountId) {
        setError("Please select an account for the payment.");
        return;
      }
    }

    setIsSubmitting(true);

    const payload: any = {
      direction,
      amountAed: parseFloat(amount),
      occurredAt: new Date(date),
      clientId: clientId || null,
      vendorName: vendorName || undefined,
      description: description || undefined,
    };

    let res;
    if (transaction) {
      res = await updateTransactionAction(transaction.id, payload);
    } else {
      if (isPaidNow && paidAmount && parseFloat(paidAmount) > 0) {
        payload.paidAmountAed = parseFloat(paidAmount);
        payload.paymentMode = paymentMode;
        payload.accountId = accountId;
      }
      res = await createTransactionAction(payload);
    }
    
    setIsSubmitting(false);
    
    if (res.success) {
      // Reset form
      setAmount("");
      setDescription("");
      setVendorName("");
      setIsPaidNow(false);
      setPaidAmount("");
      onClose();
    } else {
      setError(res.error || "An error occurred");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {transaction ? "Edit" : "Add"} {direction === "INCOME" ? "Income" : "Expense"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body & Footer wrapped in Form */}
        {isLoading ? (
          <div className="flex justify-center p-8 flex-1 items-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <form id="txn-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              
              {error && (
                <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                  {error}
                </div>
              )}

              {direction === "INCOME" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Client <span className="text-rose-500">*</span></label>
                  <select 
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                  >
                    <option value="" disabled>Select client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Vendor / Payee</label>
                  <Input 
                    type="text" 
                    value={vendorName} 
                    onChange={e => setVendorName(e.target.value)}
                    placeholder="e.g. Dubai Municipality"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total Amount (AED) <span className="text-rose-500">*</span></label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1500.00"
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
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>

              {!transaction && (
                <div className="pt-2 border-t border-border mt-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={isPaidNow}
                    onChange={e => {
                      setIsPaidNow(e.target.checked);
                      if (e.target.checked && !paidAmount) setPaidAmount(amount);
                    }}
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  Record payment now
                </label>

                {isPaidNow && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Paid Amount (AED) <span className="text-rose-500">*</span></label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        max={amount || undefined}
                        value={paidAmount} 
                        onChange={e => setPaidAmount(e.target.value)}
                        placeholder="e.g. 500.00"
                        className="bg-background"
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
                    <div className="space-y-1.5 sm:col-span-2">
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
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Transaction"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
