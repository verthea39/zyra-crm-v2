"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  DollarSign, 
  AlertCircle,
  SearchX,
  FileText,
  Lock,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TransactionModal from "./TransactionModal";

export default function FinanceDashboard({ 
  initialSummary, 
  initialTransactions,
  initialReceivables
}: any) {
  const [activeTab, setActiveTab] = useState("transactions");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDirection, setModalDirection] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === "471379") {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const openModal = (direction: "INCOME" | "EXPENSE") => {
    setModalDirection(direction);
    setIsModalOpen(true);
  };

  const formatMoney = (fils: string | number) => {
    return (Number(fils) / 100).toLocaleString('en-AE', { 
      style: 'currency', 
      currency: 'AED' 
    });
  };

  const sum = initialSummary || {
    revenueFils: 0,
    expenseFils: 0,
    netFils: 0,
    outstandingDueFils: 0,
    outstandingPayableFils: 0,
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-md glass-panel p-8 text-center border-border/50 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
              <Lock className="size-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Restricted Access</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-[280px]">
              To view Finance & Ledger data, please enter the 6-digit security PIN.
            </p>
            <form onSubmit={handleUnlock} className="w-full flex flex-col items-center gap-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • • • •"
                className={`text-center text-2xl tracking-[0.5em] font-mono h-14 w-full max-w-[200px] bg-background/50 border-border/50 shadow-inner ${
                  pinError ? "border-rose-500/50 ring-2 ring-rose-500/20" : "focus:border-primary/50"
                }`}
                autoFocus
              />
              {pinError && (
                <p className="text-sm font-medium text-rose-500 animate-in slide-in-from-top-1">
                  Incorrect PIN. Please try again.
                </p>
              )}
              <Button type="submit" className="w-full max-w-[200px] h-12 mt-2 shadow-lg shadow-primary/20 transition-transform active:scale-95" disabled={pin.length < 6}>
                Unlock Ledger
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="glass shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Billed)</CardTitle>
            <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(sum.revenueFils)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total invoiced in period
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <div className="size-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <ArrowDownIcon className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(sum.expenseFils)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Govt & overhead costs
            </p>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(sum.netFils)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue minus expenses
            </p>
          </CardContent>
        </Card>

        {/* Visually emphasized Outstanding Due card */}
        <Card className="border-warning/50 bg-warning/5 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-warning-foreground">
              Outstanding Due
            </CardTitle>
            <div className="size-8 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground tabular-nums">
              {formatMoney(sum.outstandingDueFils)}
            </div>
            <p className="text-xs font-medium text-warning-foreground/80 mt-1">
              Money earned not yet collected
            </p>
          </CardContent>
        </Card>

        {/* Visually emphasized Outstanding Payable card */}
        <Card className="border-rose-500/50 bg-rose-500/5 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-rose-500">
              Outstanding Payable
            </CardTitle>
            <div className="size-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500 tabular-nums">
              {formatMoney(sum.outstandingPayableFils)}
            </div>
            <p className="text-xs font-medium text-rose-500/80 mt-1">
              Money owed to vendors
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6" onValueChange={setActiveTab}>
        {/* Tabs & Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-muted/50 p-1 border shadow-sm rounded-lg">
            <TabsTrigger value="transactions" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="receivables" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              Receivables Ageing
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
              P&L Reports
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5" onClick={() => {
              window.location.href = "/api/export?scope=full";
            }}>
              <Download className="size-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5" onClick={() => openModal("EXPENSE")}>
              Add Expense
            </Button>
            <Button className="shadow-lg shadow-primary/20 transition-transform active:scale-95" onClick={() => openModal("INCOME")}>
              Add Income
            </Button>
          </div>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="focus-visible:outline-none">
          <Card className="glass-panel overflow-hidden border-border/50">
            {/* Filters Bar */}
            <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Input 
                placeholder="Search references, description..." 
                className="max-w-sm bg-background/50 border-border/50 shadow-inner" 
              />
              <select className="bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-inner">
                <option value="this_month">This Month</option>
                <option value="today">Today</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
            
            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Ref</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Client / Vendor</th>
                    <th className="px-6 py-4 font-medium text-right">Amount (AED)</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {initialTransactions?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-0 py-0">
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                            <SearchX className="size-8 text-muted-foreground/70" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground">No transactions found</h3>
                          <p className="text-sm mt-1 max-w-sm">
                            Nothing matches these filters. Try widening the date range or clearing the search keywords.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    initialTransactions?.data?.map((txn: any) => (
                      <tr key={txn.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{format(new Date(txn.occurredAt), 'dd MMM yyyy')}</td>
                        <td className="px-6 py-4 font-medium">{txn.reference}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            txn.direction === 'INCOME' 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {txn.direction}
                          </span>
                        </td>
                        <td className="px-6 py-4 truncate max-w-[200px]">{txn.client?.name || txn.vendorName}</td>
                        <td className="px-6 py-4 text-right font-medium tabular-nums">
                          {formatMoney(txn.amountFils)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs font-medium border border-border/50 text-muted-foreground">
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                          Edit
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="focus-visible:outline-none">
          <Card className="glass-panel overflow-hidden border-border/50">
            <div className="p-5 border-b border-border/50 bg-muted/20">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Client Receivables
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Outstanding amounts grouped by ageing buckets.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Client</th>
                    <th className="px-6 py-4 font-medium text-right">0-30 Days</th>
                    <th className="px-6 py-4 font-medium text-right">31-60 Days</th>
                    <th className="px-6 py-4 font-medium text-right">61-90 Days</th>
                    <th className="px-6 py-4 font-medium text-right">90+ Days</th>
                    <th className="px-6 py-4 font-medium text-right text-rose-600 font-bold">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {initialReceivables?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-0 py-0">
                         <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                          <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <AlertCircle className="size-6 text-emerald-600" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                          <p className="text-sm mt-1">There are no outstanding receivables.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    initialReceivables?.map((r: any) => {
                      const total = Number(r.bucket_0_30) + Number(r.bucket_31_60) + Number(r.bucket_61_90) + Number(r.bucket_90_plus);
                      if (total === 0) return null;
                      return (
                        <tr key={r.clientId} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{r.name}</td>
                          <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">{formatMoney(r.bucket_0_30)}</td>
                          <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">{formatMoney(r.bucket_31_60)}</td>
                          <td className="px-6 py-4 text-right tabular-nums text-warning font-medium">{formatMoney(r.bucket_61_90)}</td>
                          <td className="px-6 py-4 text-right tabular-nums text-rose-500 font-semibold">{formatMoney(r.bucket_90_plus)}</td>
                          <td className="px-6 py-4 text-right tabular-nums text-rose-600 font-bold bg-rose-500/5">
                            {formatMoney(total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="focus-visible:outline-none">
          <Card className="glass-panel border-border/50 p-12 text-center flex flex-col items-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-sm border border-primary/20">
              <FileText className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Profit & Loss Reports</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              Advanced reporting features are currently under development. You will soon be able to generate full P&L statements here.
            </p>
          </Card>
        </TabsContent>
        
      </Tabs>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        direction={modalDirection} 
      />
    </div>
  );
}
