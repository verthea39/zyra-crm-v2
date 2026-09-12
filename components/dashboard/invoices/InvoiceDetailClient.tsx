"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, DollarSign, Download, Plus, AlertCircle, Loader2, X } from "lucide-react";

export default function InvoiceDetailClient({ invoice }: { invoice: any }) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const balanceAed = Number(invoice.balanceDueMinor) / 100;
  const [amount, setAmount] = useState(balanceAed > 0 ? balanceAed.toString() : "");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const formatMoney = (fils: string | number) => {
    return (Number(fils) / 100).toLocaleString('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'PARTIAL': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'UNPAID': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'VOID': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: paymentMode,
          reference_number: reference || undefined,
          notes: notes || undefined,
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setIsPaymentModalOpen(false);
      setAmount("");
      setReference("");
      setNotes("");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              Issued on {format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <Button onClick={() => {
              setAmount((Number(invoice.balanceDueMinor) / 100).toString());
              setIsPaymentModalOpen(true);
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col justify-center items-center text-center bg-card border-border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
          <p className="text-3xl font-bold tabular-nums text-foreground">{formatMoney(invoice.totalPayableMinor)}</p>
        </Card>
        <Card className="p-6 flex flex-col justify-center items-center text-center bg-emerald-500/5 border-emerald-500/20 shadow-sm">
          <p className="text-sm font-medium text-emerald-600/80 mb-1">Total Paid</p>
          <p className="text-3xl font-bold tabular-nums text-emerald-600">{formatMoney(invoice.paidAmountMinor)}</p>
        </Card>
        <Card className="p-6 flex flex-col justify-center items-center text-center bg-rose-500/5 border-rose-500/20 shadow-sm">
          <p className="text-sm font-medium text-rose-600/80 mb-1">Remaining Balance</p>
          <p className="text-3xl font-bold tabular-nums text-rose-600">{formatMoney(invoice.balanceDueMinor)}</p>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment History Ledger
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Date Recorded</th>
                <th className="px-6 py-3 font-medium">Payment Mode</th>
                <th className="px-6 py-3 font-medium">Reference #</th>
                <th className="px-6 py-3 font-medium">Notes</th>
                <th className="px-6 py-3 font-medium text-right">Amount Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoice.paymentAllocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No payments have been recorded for this invoice yet.
                  </td>
                </tr>
              ) : (
                invoice.paymentAllocations.map((allocation: any) => (
                  <tr key={allocation.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(allocation.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                        {allocation.payment.mode.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {allocation.payment.chequeNo || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {allocation.payment.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600 tabular-nums">
                      {formatMoney(allocation.amountMinor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-emerald-600">Record Partial Payment</h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 overflow-y-auto space-y-4">
                
                {error && (
                  <div className="p-3 flex gap-2 items-start text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount Received (AED) <span className="text-rose-500">*</span></label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    max={Number(invoice.balanceDueMinor) / 100}
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground flex justify-between">
                    <span>Current balance: {formatMoney(invoice.balanceDueMinor)}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Payment Method <span className="text-rose-500">*</span></label>
                  <select 
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="PORTAL_BALANCE">Portal Balance</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Reference Number</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. UTR-123456 or Cheque #..."
                    value={reference} 
                    onChange={e => setReference(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notes</label>
                  <Input 
                    type="text" 
                    placeholder="Any additional details..."
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                  ) : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
