"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Search,
  SearchX,
  FileText,
  DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ReceivePaymentModal from "./ReceivePaymentModal";

export default function InvoicesClient({ initialData }: { initialData: any }) {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState(initialData?.data || []);
  const [paymentModalTxn, setPaymentModalTxn] = useState<any>(null);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="glass-panel overflow-hidden border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reference, description, client..." 
              className="pl-9 bg-background/50 border-border/50 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-inner">
            <option value="all">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Billed (AED)</th>
                <th className="px-6 py-4 font-medium text-right">Balance Due (AED)</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-0 py-0">
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                        <SearchX className="size-8 text-muted-foreground/70" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No invoices found</h3>
                      <p className="text-sm mt-1 max-w-sm">
                        There are no income transactions that match your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.filter((t: any) => 
                  t.reference.toLowerCase().includes(search.toLowerCase()) ||
                  (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
                  (t.client?.corporateProfile?.companyNameEn || t.client?.individualProfile?.fullNameEn || "").toLowerCase().includes(search.toLowerCase())
                ).map((txn: any) => {
                  const billedFils = Number(txn.amountFils) + Number(txn.taxFils);
                  const settledFils = Number(txn.settledFils);
                  const balanceFils = billedFils - settledFils;

                  return (
                    <tr key={txn.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{format(new Date(txn.occurredAt), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4 font-medium">{txn.reference}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{txn.client?.corporateProfile?.companyNameEn || txn.client?.individualProfile?.fullNameEn || "N/A"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{txn.category?.name || "General"}</td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">{formatMoney(billedFils)}</td>
                      <td className="px-6 py-4 text-right font-medium text-rose-500 tabular-nums">
                        {balanceFils > 0 ? formatMoney(balanceFils) : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                        {balanceFils > 0 && (
                          <button
                            onClick={() => setPaymentModalTxn(txn)}
                            className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Receive Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <a 
                          href={`/api/invoices/${txn.id}/pdf`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Print/Download Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ReceivePaymentModal 
        isOpen={!!paymentModalTxn}
        onClose={() => setPaymentModalTxn(null)}
        transaction={paymentModalTxn}
      />
    </div>
  );
}
