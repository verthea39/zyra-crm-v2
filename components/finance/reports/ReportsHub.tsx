"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, TrendingUp, BookOpen, Wallet, CalendarCheck, FileText } from "lucide-react";
import {
  getProfitReport,
  getCashBook,
  getWalletAccountReport,
  getDailyClosingReport,
  getInvoiceItemReport,
  type ReportRange,
  type InvoiceCollectionFilter,
} from "@/app/actions/reports";
import { exportAsExcel, printGenericReport } from "@/lib/exportLedger";

type TabKey = "profit" | "cashbook" | "wallets" | "closing" | "invoices";

const TABS: { key: TabKey; label: string; icon: typeof TrendingUp }[] = [
  { key: "profit", label: "Profit Report", icon: TrendingUp },
  { key: "cashbook", label: "Cash Book", icon: BookOpen },
  { key: "wallets", label: "Wallet & Account", icon: Wallet },
  { key: "closing", label: "Daily Closing", icon: CalendarCheck },
  { key: "invoices", label: "Invoice & Item-wise", icon: FileText },
];

type RangeMode = "today" | "yesterday" | "thisMonth" | "lastMonth" | "custom";

const RANGE_MODES: { key: RangeMode; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function computeRange(mode: RangeMode, customFrom: string, customTo: string): ReportRange {
  const now = new Date();
  if (mode === "today") {
    const d = toISODate(now);
    return { from: d, to: d };
  }
  if (mode === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const d = toISODate(y);
    return { from: d, to: d };
  }
  if (mode === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(start), to: toISODate(now) };
  }
  if (mode === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toISODate(start), to: toISODate(end) };
  }
  return { from: customFrom || toISODate(now), to: customTo || toISODate(now) };
}

const fmt = (minor: number) => (minor / 100).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SummaryCard({ label, value, tone, suffix = "AED" }: { label: string; value: string; tone: "slate" | "emerald" | "rose"; suffix?: string }) {
  const toneClasses = {
    slate: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-xl font-bold mt-1">{suffix ? `${suffix} ` : ""}{value}</p>
    </div>
  );
}

export function ReportsHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("profit");
  const [rangeMode, setRangeMode] = useState<RangeMode>("thisMonth");
  const [customFrom, setCustomFrom] = useState(toISODate(new Date()));
  const [customTo, setCustomTo] = useState(toISODate(new Date()));
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceCollectionFilter>("ALL");
  // Cash Book / Daily Closing are single-day snapshots with their own date
  // selector -- independent of the range picker used by the other tabs.
  const [singleDate, setSingleDate] = useState(toISODate(new Date()));
  const [loading, setLoading] = useState(false);

  const [profitData, setProfitData] = useState<Awaited<ReturnType<typeof getProfitReport>> | null>(null);
  const [cashBookData, setCashBookData] = useState<Awaited<ReturnType<typeof getCashBook>> | null>(null);
  const [walletData, setWalletData] = useState<Awaited<ReturnType<typeof getWalletAccountReport>> | null>(null);
  const [closingData, setClosingData] = useState<Awaited<ReturnType<typeof getDailyClosingReport>> | null>(null);
  const [invoiceData, setInvoiceData] = useState<Awaited<ReturnType<typeof getInvoiceItemReport>> | null>(null);

  const range = useMemo(() => computeRange(rangeMode, customFrom, customTo), [rangeMode, customFrom, customTo]);
  const isSingleDateTab = activeTab === "cashbook" || activeTab === "closing";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      if (activeTab === "profit") setProfitData(await getProfitReport(range));
      else if (activeTab === "cashbook") setCashBookData(await getCashBook(singleDate));
      else if (activeTab === "wallets") setWalletData(await getWalletAccountReport(range));
      else if (activeTab === "closing") setClosingData(await getDailyClosingReport(singleDate));
      else if (activeTab === "invoices") setInvoiceData(await getInvoiceItemReport(range, invoiceFilter));
    };

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, range, singleDate, invoiceFilter]);

  const handleExportExcel = async () => {
    const { headers, rows, currencyCols, title } = buildExportTable();
    if (!rows.length) return;
    await exportAsExcel(headers, rows, currencyCols, `Zyra_${title.replace(/\s+/g, "_")}`, title);
  };

  const handleExportPDF = () => {
    const { headers, rows, currencyCols, title } = buildExportTable();
    if (!rows.length) return;
    printGenericReport(headers, rows, currencyCols, title);
  };

  function buildExportTable(): { headers: string[]; rows: (string | number)[][]; currencyCols: number[]; title: string } {
    if (activeTab === "profit" && profitData) {
      return {
        headers: ["Service Name", "Volume", "Total Revenue (AED)", "Total Supplier Cost (AED)", "Net Profit (AED)", "Margin %"],
        rows: profitData.rows.map((r) => [r.service, r.volume, r.revenue / 100, r.supplierCost / 100, r.netProfit / 100, r.marginPct.toFixed(1)]),
        currencyCols: [2, 3, 4],
        title: "Profit Report",
      };
    }
    if (activeTab === "cashbook" && cashBookData) {
      return {
        headers: ["Date / Time", "Particulars / Client", "Type", "Debit (AED)", "Credit (AED)", "Running Balance (AED)"],
        rows: cashBookData.entries.map((e) => [
          new Date(e.time).toLocaleString(),
          `${e.reference} — ${e.description}`,
          e.direction === "INFLOW" ? "Inflow" : "Outflow",
          e.direction === "OUTFLOW" ? e.amount / 100 : 0,
          e.direction === "INFLOW" ? e.amount / 100 : 0,
          e.runningBalance / 100,
        ]),
        currencyCols: [3, 4, 5],
        title: `Cash Book ${cashBookData.date}`,
      };
    }
    if (activeTab === "wallets" && walletData) {
      const rows: (string | number)[][] = [];
      for (const w of walletData.wallets) {
        for (const t of w.transactions) {
          rows.push([w.name, new Date(t.date).toLocaleDateString(), t.type, t.amount, t.balanceAfter ?? "", t.clientName || "", t.description || ""]);
        }
      }
      return {
        headers: ["Wallet", "Date", "Type", "Amount (AED)", "Balance After (AED)", "Client", "Description"],
        rows,
        currencyCols: [3, 4],
        title: "Wallet & Account Report",
      };
    }
    if (activeTab === "closing" && closingData) {
      return {
        headers: ["Metric", "Amount (AED)"],
        rows: [
          ["Cash Collections", closingData.collections.cash / 100],
          ["Card Collections", closingData.collections.card / 100],
          ["Bank Collections", closingData.collections.bank / 100],
          ["Total Collections", closingData.totalCollections / 100],
          ["Outstanding / Credit Given Today", closingData.outstandingToday / 100],
          ["Supplier / Portal Fees Disbursed", closingData.supplierFeesDisbursed / 100],
          ["Office Expenses", closingData.officeExpenses / 100],
          ["Net Cash Position", closingData.netCashPosition / 100],
        ],
        currencyCols: [1],
        title: `Daily Closing ${closingData.date}`,
      };
    }
    if (activeTab === "invoices" && invoiceData) {
      return {
        headers: ["Service Item", "Qty Sold", "Avg Billed Rate (AED)", "Total Billed (AED)", "Total VAT (AED)"],
        rows: invoiceData.items.map((i) => [i.service, i.qty, i.avgRate / 100, i.totalBilled / 100, i.totalVat / 100]),
        currencyCols: [2, 3, 4],
        title: "Invoice & Item-wise Report",
      };
    }
    return { headers: [], rows: [], currencyCols: [], title: "Report" };
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? "bg-[#98682E] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Global tools: date range + export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {isSingleDateTab ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="h-8 rounded-md border border-slate-200 px-2 text-xs"
            />
            <button
              onClick={() => setSingleDate(toISODate(new Date()))}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Today
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setRangeMode(m.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  rangeMode === m.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {m.label}
              </button>
            ))}
            {rangeMode === "custom" && (
              <div className="flex items-center gap-2 ml-1">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 rounded-md border border-slate-200 px-2 text-xs" />
                <span className="text-slate-400 text-xs">to</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 rounded-md border border-slate-200 px-2 text-xs" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading report...</p>}

      {!loading && activeTab === "profit" && profitData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SummaryCard label="Total Billed Revenue" value={fmt(profitData.summary.grossRevenue)} tone="slate" />
            <SummaryCard label="Direct Supplier/Govt Costs" value={fmt(profitData.summary.totalDirectCosts)} tone="rose" />
            <SummaryCard label="Net Profit" value={fmt(profitData.summary.netMargin)} tone="emerald" />
            <SummaryCard label="Average Margin %" value={`${profitData.summary.avgMarginPct.toFixed(1)}%`} suffix="" tone={profitData.summary.avgMarginPct < 0 ? "rose" : "emerald"} />
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Service Name</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3 text-right">Revenue (AED)</th>
                  <th className="px-4 py-3 text-right">Supplier Cost (AED)</th>
                  <th className="px-4 py-3 text-right">Net Profit (AED)</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitData.rows.map((r) => (
                  <tr key={r.service} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{r.service}</td>
                    <td className="px-4 py-2.5 text-right">{r.volume}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{fmt(r.revenue)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">{fmt(r.supplierCost)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${r.netProfit < 0 ? "text-rose-600" : "text-emerald-700"}`}>{fmt(r.netProfit)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${r.marginPct < 0 ? "text-rose-600" : "text-emerald-700"}`}>{r.marginPct.toFixed(1)}%</td>
                  </tr>
                ))}
                {profitData.rows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No income transactions in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "cashbook" && cashBookData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard label={`Opening Balance (${cashBookData.date})`} value={fmt(cashBookData.openingBalance)} tone="slate" />
            <SummaryCard label="Net Movement" value={fmt(cashBookData.closingBalance - cashBookData.openingBalance)} tone={cashBookData.closingBalance >= cashBookData.openingBalance ? "emerald" : "rose"} />
            <SummaryCard label="Closing Cash in Hand" value={fmt(cashBookData.closingBalance)} tone="emerald" />
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date / Time</th>
                  <th className="px-4 py-3 text-left">Particulars / Client</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Debit (AED)</th>
                  <th className="px-4 py-3 text-right">Credit (AED)</th>
                  <th className="px-4 py-3 text-right">Running Balance (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashBookData.entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(e.time).toLocaleString("en-AE", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-700">{e.reference}</span>
                      <span className="text-slate-400"> — {e.description}</span>
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${e.direction === "INFLOW" ? "text-emerald-700" : "text-rose-600"}`}>
                      {e.direction === "INFLOW" ? "Inflow" : "Outflow"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-rose-600">{e.direction === "OUTFLOW" ? fmt(e.amount) : ""}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{e.direction === "INFLOW" ? fmt(e.amount) : ""}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmt(e.runningBalance)}</td>
                  </tr>
                ))}
                {cashBookData.entries.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No cash movements on this date.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "wallets" && walletData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SummaryCard label="Cash Drawer" value={fmt(walletData.channels.cashDrawer)} tone="slate" />
            <SummaryCard label="Main Bank Account" value={fmt(walletData.channels.mainBankAccount)} tone="slate" />
            <SummaryCard label="Corporate Card" value={fmt(walletData.channels.corporateCard)} tone="slate" />
            <SummaryCard label="Government Portals" value={walletData.channels.governmentPortals.toFixed(2)} tone="slate" />
          </div>
          {walletData.wallets.map((w) => (
            <div key={w.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                <span className="font-semibold text-slate-800">{w.name}</span>
                <span className="font-bold text-[#98682E]">AED {w.balance.toFixed(2)}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">Balance After</th>
                    <th className="px-4 py-2 text-left">Client / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {w.transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className={`px-4 py-2 font-semibold ${t.type === "TOP_UP" ? "text-emerald-700" : "text-rose-600"}`}>{t.type}</td>
                      <td className="px-4 py-2 text-right font-mono">{t.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono">{t.balanceAfter?.toFixed(2) ?? "--"}</td>
                      <td className="px-4 py-2 text-slate-500">{t.clientName || t.caseRef || t.description || "--"}</td>
                    </tr>
                  ))}
                  {w.transactions.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-4 text-slate-400 italic text-xs">No wallet activity in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === "closing" && closingData && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">End-of-day snapshot for <span className="font-semibold text-slate-800">{closingData.date}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard label="Cash Collections" value={fmt(closingData.collections.cash)} tone="slate" />
            <SummaryCard label="Bank Collections" value={fmt(closingData.collections.bank)} tone="slate" />
            <SummaryCard label="Card Collections" value={fmt(closingData.collections.card)} tone="slate" />
            <SummaryCard label="Total Collections" value={fmt(closingData.totalCollections)} tone="emerald" />
            <SummaryCard label="Outstanding / Credit Given Today" value={fmt(closingData.outstandingToday)} tone="rose" />
            <SummaryCard label="Supplier / Portal Fees Disbursed" value={fmt(closingData.supplierFeesDisbursed)} tone="rose" />
            <SummaryCard label="Office Expenses" value={fmt(closingData.officeExpenses)} tone="rose" />
            <SummaryCard label="Net Cash Position" value={fmt(closingData.netCashPosition)} tone={closingData.netCashPosition >= 0 ? "emerald" : "rose"} />
          </div>
        </div>
      )}

      {!loading && activeTab === "invoices" && invoiceData && (
        <div className="space-y-5">
          <div className="flex gap-2">
            {([
              ["ALL", "All"],
              ["PAID", "Paid"],
              ["PARTIAL", "Partial"],
              ["PENDING", "Pending"],
            ] as [InvoiceCollectionFilter, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  invoiceFilter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard label="Total Revenue" value={fmt(invoiceData.summary.totalRevenue)} tone="slate" />
            <SummaryCard label="Total VAT Collected" value={fmt(invoiceData.summary.totalVat)} tone="slate" />
            <SummaryCard label="Documents" value={String(invoiceData.summary.count)} suffix="" tone="slate" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Item-wise Breakdown</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Service Item</th>
                    <th className="px-4 py-3 text-right">Qty Sold</th>
                    <th className="px-4 py-3 text-right">Avg Billed Rate (AED)</th>
                    <th className="px-4 py-3 text-right">Total Billed (AED)</th>
                    <th className="px-4 py-3 text-right">Total VAT (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceData.items.map((i) => (
                    <tr key={i.service} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium">{i.service}</td>
                      <td className="px-4 py-2.5 text-right">{i.qty}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmt(i.avgRate)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmt(i.totalBilled)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmt(i.totalVat)}</td>
                    </tr>
                  ))}
                  {invoiceData.items.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">No documents in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Documents</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Collection</th>
                    <th className="px-4 py-3 text-right">Total (AED)</th>
                    <th className="px-4 py-3 text-left">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceData.documents.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium">{d.reference}</td>
                      <td className="px-4 py-2.5">{d.client}</td>
                      <td className="px-4 py-2.5">{d.type}</td>
                      <td className="px-4 py-2.5">{d.status}</td>
                      <td className={`px-4 py-2.5 font-semibold ${
                        d.collectionStatus === "PAID" ? "text-emerald-700" : d.collectionStatus === "PARTIAL" ? "text-amber-700" : "text-rose-600"
                      }`}>
                        {d.collectionStatus}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmt(d.total)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{new Date(d.issueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {invoiceData.documents.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-400 italic">No documents in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
