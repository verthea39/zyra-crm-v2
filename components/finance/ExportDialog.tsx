"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileSpreadsheet, FileText, FileType, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@prisma/client";
import type { ClientWithTransactions } from "./ClientsTable";
import {
  buildExportTable,
  exportAsCSV,
  exportAsExcel,
  printLedgerStatement,
  type ExportFormat,
  type ExportDataset,
  type ExportDateRange,
  type ExportStatusFilter,
} from "@/lib/exportLedger";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; sub: string; icon: typeof FileSpreadsheet; iconClass: string }[] = [
  { value: "xlsx", label: "Microsoft Excel", sub: ".xlsx -- formatted, currency, totals", icon: FileSpreadsheet, iconClass: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "csv", label: "CSV Spreadsheet", sub: ".csv -- standard comma-separated data", icon: FileText, iconClass: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "pdf", label: "PDF Ledger Statement", sub: "Printable A4 landscape report", icon: FileType, iconClass: "text-rose-600 bg-rose-50 border-rose-200" },
];

const SELECT_CLASS = "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none";

export function ExportDialog({
  open,
  onOpenChange,
  transactions,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  clients: ClientWithTransactions[];
}) {
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [dataset, setDataset] = useState<ExportDataset>("ledger");
  const [dateRange, setDateRange] = useState<ExportDateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [status, setStatus] = useState<ExportStatusFilter>("all");
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    setExporting(true);
    try {
      const scope = { dataset, dateRange, customFrom, customTo, status };
      const { headers, rows, title, currencyCols } = buildExportTable(scope, transactions, clients);

      if (rows.length === 0) {
        toast.error("No records match this scope -- adjust the filters and try again.");
        return;
      }

      const filenamePrefix = `Zyra_${title.replace(/[^a-zA-Z0-9]+/g, "_")}`;

      if (format === "csv") {
        exportAsCSV(headers, rows, filenamePrefix);
      } else if (format === "xlsx") {
        await exportAsExcel(headers, rows, currencyCols, filenamePrefix, title);
      } else {
        printLedgerStatement(headers, rows, currencyCols, title);
      }

      toast.success(`${title} exported successfully (${rows.length} record${rows.length === 1 ? "" : "s"})`);
      onOpenChange(false);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed -- please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>Choose a format and scope for your export.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <div className="grid grid-cols-1 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = format === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selected ? "border-[#98682E] bg-[#FDF8F0]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.sub}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 ${selected ? "border-[#98682E] bg-[#98682E]" : "border-slate-300"}`} />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Dataset</label>
              <select value={dataset} onChange={(e) => setDataset(e.target.value as ExportDataset)} className={SELECT_CLASS}>
                <option value="ledger">Ledger Transactions</option>
                <option value="invoices">Invoices & Quotations</option>
                <option value="clients">Client Directory</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value as ExportDateRange)} className={SELECT_CLASS} disabled={dataset === "clients"}>
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ExportStatusFilter)} className={SELECT_CLASS}>
                <option value="all">All Records</option>
                <option value="paid">Paid Only</option>
                <option value="outstanding">Pending / Outstanding Only</option>
              </select>
            </div>
          </div>

          {dateRange === "custom" && dataset !== "clients" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">From</label>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={SELECT_CLASS} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">To</label>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={SELECT_CLASS} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="w-full h-11 rounded-xl bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing export..." : "Download Export"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
