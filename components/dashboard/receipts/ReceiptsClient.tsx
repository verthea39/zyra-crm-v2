"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Search,
  SearchX,
  ReceiptText,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ReceiptsClient({ initialData }: { initialData: any }) {
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState(initialData?.data || []);

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
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`/api/receipts/${payment.id}/pdf`, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
