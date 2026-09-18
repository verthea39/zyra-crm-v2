"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, FileText, GitMerge, ShieldAlert, Download, Loader2,
  Phone, Mail, MapPin, MessageCircle,
} from "lucide-react";
import { printClientStatement, type StatementRange } from "@/lib/clientStatement";
import { getBranding } from "@/app/actions/branding";

const STAGE_LABELS: Record<string, string> = {
  DRAFT_INTAKE: "Draft / Intake",
  OFFER_LETTER_MOHRE: "Offer Letter & MOHRE",
  ENTRY_PERMIT: "Entry Permit",
  MEDICAL_BIOMETRICS: "Medical & Biometrics",
  VISA_STAMPING_EID: "Visa Stamping / EID",
  COMPLETED_HANDOVER: "Completed",
  PRE_CHECK: "Pre-Check",
  SUBMITTED: "Submitted",
  COMPLETED: "Completed",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PAID: "bg-emerald-50 border-emerald-200 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-50 border-amber-200 text-amber-700",
  PENDING: "bg-slate-100 border-slate-200 text-slate-600",
  OVERDUE: "bg-rose-50 border-rose-200 text-rose-700",
};

const STATUS_DISPLAY: Record<string, string> = {
  PAID: "PAID",
  PARTIALLY_PAID: "PARTIAL",
  PENDING: "PENDING",
  OVERDUE: "OVERDUE",
};

function formatMoney(minor: number): string {
  return `AED ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-GB");
}

// Documents within 30 days of expiry are flagged "Expiring" rather than
// "Valid" -- gives coordinators a heads-up window to renew before the
// document actually lapses into "Expired".
const EXPIRING_SOON_WINDOW_DAYS = 30;

function expiryBadge(expiryDate: string | Date | null | undefined) {
  if (!expiryDate) {
    return { status: "No Data", label: "No Expiry Data", detail: null as string | null, className: "bg-slate-100 border-slate-200 text-slate-500" };
  }
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
  if (days < 0) {
    return { status: "Expired", label: "Expired", detail: `${Math.abs(days)}d ago`, className: "bg-rose-50 border-rose-200 text-rose-700" };
  }
  if (days <= EXPIRING_SOON_WINDOW_DAYS) {
    return { status: "Expiring", label: "Expiring", detail: `${days}d left`, className: "bg-amber-50 border-amber-200 text-amber-700" };
  }
  return { status: "Valid", label: "Valid", detail: `${days}d left`, className: "bg-emerald-50 border-emerald-200 text-emerald-700" };
}

type TabKey = "billing" | "cases" | "vault";

export function ClientProfileView({ client }: { client: any }) {
  const [activeTab, setActiveTab] = useState<TabKey>("billing");
  const [statementOpen, setStatementOpen] = useState(false);

  const invoices = client.transactions as any[];
  const cases = client.cases as any[];
  const vaultDocs = client.vaultDocuments as any[];

  const totalBilled = invoices.reduce((sum, tx) => sum + tx.amountTotal, 0);
  const totalPaid = invoices.reduce((sum, tx) => sum + tx.amountPaid, 0);
  const outstanding = totalBilled - totalPaid;

  const formattedPhone = client.phone?.replace(/[^0-9]/g, "");

  // Primary tracked document at the client level (separate from the
  // Document Vault attachments below): trade license for corporates,
  // passport for individuals -- the same field used to flag "expiring soon"
  // clients elsewhere (ClientsTable, LedgerView).
  const trackedDocs: { label: string; expiryDate: string | Date | null }[] = [
    client.type === "CORPORATE"
      ? { label: "Trade License", expiryDate: client.expiryDate }
      : { label: "Passport", expiryDate: client.passportExpiry },
  ];
  const visibleTrackedDocs = trackedDocs.filter((d) => d.expiryDate);

  return (
    <div className="max-w-6xl mx-auto w-full pb-16">
      <Link href="/finance/cockpit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${
                client.type === "CORPORATE" ? "bg-indigo-50 border-indigo-200 text-indigo-800" : "bg-blue-50 border-blue-200 text-blue-800"
              }`}>
                {client.type}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
              {client.phone && (
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {client.phone}</span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {client.email}</span>
              )}
              {client.place && (
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {client.place}</span>
              )}
            </div>
            {visibleTrackedDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {visibleTrackedDocs.map((doc) => {
                  const badge = expiryBadge(doc.expiryDate);
                  return (
                    <span
                      key={doc.label}
                      title={`${doc.label} expires ${formatDate(doc.expiryDate)}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${badge.className}`}
                    >
                      {doc.label}: {badge.label}{badge.detail ? ` · ${badge.detail}` : ""}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {formattedPhone && (
              <a
                href={`https://wa.me/${formattedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <button
              onClick={() => setStatementOpen(true)}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#98682E] hover:bg-[#7D5321] text-white font-semibold text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Download Statement (PDF)
            </button>
          </div>
        </div>

        {/* Financial summary strip */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Billed</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatMoney(totalBilled)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Paid</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatMoney(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Outstanding</p>
            <p className={`text-lg font-bold mt-0.5 ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {outstanding > 0 ? formatMoney(outstanding) : "Clear"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200 overflow-x-auto">
        <TabButton active={activeTab === "billing"} onClick={() => setActiveTab("billing")} icon={FileText} label={`Invoices & Billing (${invoices.length})`} />
        <TabButton active={activeTab === "cases"} onClick={() => setActiveTab("cases")} icon={GitMerge} label={`Cases & Work Orders (${cases.length})`} />
        <TabButton active={activeTab === "vault"} onClick={() => setActiveTab("vault")} icon={ShieldAlert} label={`Document Vault (${vaultDocs.length})`} />
      </div>

      {activeTab === "billing" && <BillingTab invoices={invoices} />}
      {activeTab === "cases" && <CasesTab cases={cases} />}
      {activeTab === "vault" && <VaultTab docs={vaultDocs} />}

      {statementOpen && (
        <StatementDialog client={client} invoices={invoices} onClose={() => setStatementOpen(false)} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
        active ? "border-[#98682E] text-[#98682E]" : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function BillingTab({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0) {
    return <EmptyState text="No invoices or quotations recorded for this client yet." />;
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] font-bold tracking-wider uppercase bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Service Charge (AED)</th>
            <th className="px-4 py-3 text-right">Paid (AED)</th>
            <th className="px-4 py-3 text-right">Balance (AED)</th>
            <th className="px-4 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((tx) => {
            const balance = tx.amountTotal - tx.amountPaid;
            return (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                  <Link href={`/finance/transactions/${tx.id}`} className="hover:text-primary hover:underline">{tx.reference}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(tx.date)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(tx.amountTotal)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{formatMoney(tx.amountPaid)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${balance > 0 ? "text-rose-600" : "text-slate-400"}`}>{formatMoney(balance)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${STATUS_BADGE_CLASS[tx.status] || STATUS_BADGE_CLASS.PENDING}`}>
                    {STATUS_DISPLAY[tx.status] || tx.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CasesTab({ cases }: { cases: any[] }) {
  if (cases.length === 0) {
    return <EmptyState text="No cases have been opened for this client yet." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cases.map((c) => (
        <Link
          key={c.id}
          href={`/pipeline`}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#98682E]/40 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded tracking-widest">
              {c.reference}
            </span>
            <span className="text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest border bg-slate-50 border-slate-200 text-slate-600">
              {STAGE_LABELS[c.stage] || c.stage}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">{c.applicantName || "Unnamed Applicant"}</h3>
          <p className="text-xs text-slate-500 mb-2">{c.serviceType}</p>
          <p className="text-[11px] text-slate-400">Coordinator: {c.coordinator?.name || "Unassigned"}</p>
        </Link>
      ))}
    </div>
  );
}

function VaultTab({ docs }: { docs: any[] }) {
  if (docs.length === 0) {
    return <EmptyState text="No documents stored in the vault for this client." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {docs.map((doc) => {
        const badge = expiryBadge(doc.expiryDate);
        return (
          <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{doc.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{doc.category}</p>
              <p className="text-[11px] text-slate-400 mt-1">Expires: {formatDate(doc.expiryDate)}</p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${badge.className}`}>
              {badge.label}{badge.detail ? ` · ${badge.detail}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400 italic">
      {text}
    </div>
  );
}

function StatementDialog({ client, invoices, onClose }: { client: any; invoices: any[]; onClose: () => void }) {
  const [range, setRange] = useState<StatementRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const branding = await getBranding().catch(() => undefined);
      await printClientStatement(client, invoices, { range, customFrom, customTo }, branding);
    } finally {
      setTimeout(() => setGenerating(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Download Statement</h2>
        <p className="text-xs text-slate-500 mb-4">Choose the period to include in the PDF statement.</p>

        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Date Range</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as StatementRange)}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
          >
            <option value="month">This Month</option>
            <option value="last3months">Last 3 Months</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {range === "custom" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 h-10 rounded-xl bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? "Preparing..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
