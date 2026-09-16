import { useState } from "react";
import { useRouter } from "next/navigation";
import { Transaction } from "@prisma/client";
import { Edit2, Trash2, MoreVertical, Eye, Printer, Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteTransaction } from "@/app/actions/finance";
import { downloadDocumentPDF, printViaIframe, type LineItem } from "@/lib/printUtils";
import { getBranding } from "@/app/actions/branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const formatMoney = (minorUnits: number) => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date)).replace(/\//g, "-");
};

export function LedgerTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, reference: string) => {
    if (!confirm(`Delete transaction "${reference}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteTransaction(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete transaction");
    }
  };

  const handleDownloadPDF = async (tx: Transaction) => {
    const branding = await getBranding().catch(() => undefined);
    const items: LineItem[] = (tx.lineItems as any) || [
      { desc: tx.category, govCost: (tx.govFeePart || 0) / 100, proFee: (tx.serviceFeePart || 0) / 100 },
    ];
    const payload = {
      type: "TAX_INVOICE" as const,
      clientName: tx.counterparty,
      date: formatDate(tx.date),
      dueDate: tx.dueDate ? formatDate(tx.dueDate) : undefined,
      reference: tx.reference,
      caseRef: tx.reference,
      govCost: (tx.govFeePart || 0) / 100,
      proFee: (tx.serviceFeePart || 0) / 100,
      vatAmount: 0,
      totalPayable: tx.amountTotal / 100,
      amountReceived: tx.amountPaid / 100,
      lineItems: items,
    };
    try {
      await downloadDocumentPDF(payload, branding);
    } catch {
      toast.error("PDF download failed. Use Print instead.", {
        action: { label: "Print", onClick: () => printViaIframe(payload, branding) },
      });
    }
  };

  return (
    <div className="mt-6">
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {transactions.length === 0 && (
          <EmptyState icon={Receipt} title="No transactions found" description="Income and expenses recorded in the master ledger will appear here." />
        )}
        {transactions.map((tx) => {
          const isIncome = tx.type === "INCOME";
          const balance = tx.amountTotal - tx.amountPaid;
          const isPaid = tx.status === "PAID" || balance <= 0;

          return (
            <div
              key={tx.id}
              onClick={() => router.push(`/finance/transactions/${tx.id}`)}
              className="bg-card border border-border rounded-xl shadow-sm p-4 cursor-pointer hover:border-primary/50 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-600">{tx.reference}</span>
                    <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
                      isIncome ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1 truncate">{tx.counterparty}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
                </div>
                <div className={`text-right shrink-0 font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isIncome ? "+" : "-"}{formatMoney(tx.amountTotal)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  {tx.category}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                  ${tx.status === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    tx.status === 'PARTIALLY_PAID' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    tx.status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  {tx.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs">
                {isPaid ? (
                  <span className="text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Fully Paid
                  </span>
                ) : (
                  <span className="font-semibold text-slate-900 tabular-nums">Balance: {formatMoney(balance)}</span>
                )}
                {tx.dueDate && <span className="text-muted-foreground">Due {formatDate(tx.dueDate)}</span>}
              </div>

              <div className="flex items-center justify-end mt-3" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground active:scale-95 active:bg-slate-100 transition-transform">
                    <MoreVertical className="w-5 h-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => router.push(`/finance/transactions/${tx.id}`)} className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/finance/transactions/${tx.id}/edit`)} className="cursor-pointer">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadPDF(tx)} className="cursor-pointer">
                      <Printer className="w-4 h-4 mr-2" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(tx.id, tx.reference)} disabled={deletingId === tx.id} className="cursor-pointer text-rose-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-semibold tracking-wider uppercase bg-slate-50 text-slate-500 border-b border-border">
            <tr>
              <th className="px-6 py-4 sticky left-0 z-10 bg-slate-50 backdrop-blur-md">REF / ID</th>
              <th className="px-6 py-4">DATE</th>
              <th className="px-6 py-4">CLIENT / COUNTERPARTY</th>
              <th className="px-6 py-4">CATEGORY</th>
              <th className="px-6 py-4 text-right">TOTAL (AED)</th>
              <th className="px-6 py-4 text-right">PAID (AED)</th>
              <th className="px-6 py-4 text-right">BALANCE (AED)</th>
              <th className="px-6 py-4">STATUS</th>
              <th className="px-6 py-4">DUE DATE</th>
              <th className="px-6 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const balance = tx.amountTotal - tx.amountPaid;
              const isPaid = tx.status === "PAID" || balance <= 0;
              
              return (
                <tr
                  key={tx.id}
                  onClick={() => router.push(`/finance/transactions/${tx.id}`)}
                  className="hover:bg-slate-50 transition-colors group bg-card text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-card group-hover:bg-slate-50 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-semibold text-slate-600">{tx.reference}</span>
                      <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full w-max border
                        ${isIncome ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                        {tx.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tx.counterparty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? "+" : "-"}{formatMoney(tx.amountTotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs font-medium border border-slate-200">
                      {formatMoney(tx.amountPaid)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isPaid ? (
                      <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Fully Paid
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-900 tabular-nums">{formatMoney(balance)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                      ${tx.status === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        tx.status === 'PARTIALLY_PAID' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        tx.status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                    {tx.dueDate ? formatDate(tx.dueDate) : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end text-muted-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/finance/transactions/${tx.id}`)} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/finance/transactions/${tx.id}/edit`)} className="cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(tx)} className="cursor-pointer">
                            <Printer className="w-4 h-4 mr-2" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(tx.id, tx.reference)} disabled={deletingId === tx.id} className="cursor-pointer text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {transactions.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <EmptyState icon={Receipt} title="No transactions found" description="Income and expenses recorded in the master ledger will appear here." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
