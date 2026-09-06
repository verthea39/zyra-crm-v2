"use client";

import { useState, useEffect } from "react";
import { getReferenceDataAction, createTransactionAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  direction: "INCOME" | "EXPENSE";
}

export default function TransactionModal({ isOpen, onClose, direction }: TransactionModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getReferenceDataAction().then((res) => {
        if (res.success) {
          setCategories(res.data.categories.filter((c: any) => c.direction === direction));
          setClients(res.data.clients);
          
          // Auto-select first category if available
          const validCats = res.data.categories.filter((c: any) => c.direction === direction);
          if (validCats.length > 0) setCategoryId(validCats[0].id);
        } else {
          setError("Failed to load reference data.");
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, direction]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      direction,
      amountAed: parseFloat(amount),
      occurredAt: new Date(date),
      categoryId,
      clientId: clientId || null,
      vendorName: vendorName || undefined,
      description: description || undefined,
    };

    const res = await createTransactionAction(payload);
    
    setIsSubmitting(false);
    
    if (res.success) {
      // Reset form
      setAmount("");
      setDescription("");
      setVendorName("");
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
            Add {direction === "INCOME" ? "Income" : "Expense"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <form id="txn-form" onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount (AED)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  required 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1500.00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  required
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="" disabled>Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {direction === "INCOME" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Client</label>
                  <select 
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    required
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
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="txn-form" disabled={isLoading || isSubmitting}>
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

      </div>
    </div>
  );
}
