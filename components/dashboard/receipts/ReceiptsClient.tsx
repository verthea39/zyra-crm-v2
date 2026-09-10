"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  Search,
  SearchX,
  ReceiptText,
  FileText,
  RotateCcw,
  X,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reversePaymentAction } from "@/lib/actions/finance";

export default function ReceiptsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState(initialData?.data || []);
  const [paymentToReverse, setPaymentToReverse] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReverse = async () => {
    if (!paymentToReverse || !reason) return;
    setIsSubmitting(true);
    setError(null);
    const res = await reversePaymentAction(paymentToReverse.id, { reason });
    setIsSubmitting(false);
    if (res.success) {
      setPayments(payments.filter((p: any) => p.id !== paymentToReverse.id));
      setPaymentToReverse(null);
      setReason("");
      router.refresh();
    } else {
      setError(res.error || "Failed to reverse payment.");
    }
  };

  const formatMoney = (fils: string | number) => {
    return (Number(fils) / 100).toLocaleString('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="glass-panel overflow-hidden border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reference, notes, cheque no..." 
              className="pl-9 bg-background/50 border-border/50 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-inner">
            <option value="all">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="PORTAL_BALANCE">Portal Balance</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Direction</th>
                <th className="px-6 py-4 font-medium">Mode</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Account</th>
                <th className="px-6 py-4 font-medium text-right">Amount (AED)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-0 py-0">
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                        <SearchX className="size-8 text-muted-foreground/70" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No receipts found</h3>
                      <p className="text-sm mt-1 max-w-sm">
                        There are no payment records that match your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.filter((p: any) => 
                  p.reference.toLowerCase().includes(search.toLowerCase()) ||
                  (p.notes || "").toLowerCase().includes(search.toLowerCase()) ||
                  (p.chequeNo || "").toLowerCase().includes(search.toLowerCase())
                ).map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{format(new Date(payment.occurredAt), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 font-medium">{payment.reference}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        payment.direction === 'IN' 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {payment.direction === 'IN' ? 'RECEIVED' : 'PAID OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{payment.mode}</td>
                    <td className="px-6 py-4 truncate max-w-[200px]">{payment.client?.corporateProfile?.companyNameEn || payment.client?.individualProfile?.fullNameEn || "N/A"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{payment.account?.name}</td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums">
                      {formatMoney(payment.amountFils)}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`/api/receipts/${payment.id}/pdf`, '_blank')}
                        title="View PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          setPaymentToReverse(payment);
                          setError(null);
                          setReason("");
                        }}
                        title="Reverse Payment"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reverse Payment Modal */}
      {paymentToReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-rose-500">Reverse Payment</h2>
              <button 
                onClick={() => setPaymentToReverse(null)}
                className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to reverse receipt <strong>{paymentToReverse.reference}</strong> for {formatMoney(paymentToReverse.amountFils)}. This will remove its allocations from any transactions.
              </p>
              {error && (
                <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-md border border-rose-500/20">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reason for Reversal <span className="text-rose-500">*</span></label>
                <Input 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Entered by mistake"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentToReverse(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReverse} disabled={isSubmitting || !reason}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reversing...</>
                ) : "Reverse Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
