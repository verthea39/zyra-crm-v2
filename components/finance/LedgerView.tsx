"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Transaction } from "@prisma/client";
import { FilterStrip } from "./FilterStrip";
import { LedgerTable } from "./LedgerTable";
import { CockpitHeader } from "./CockpitHeader";
import { ClientsFilterStrip } from "./ClientsFilterStrip";
import { ClientsTable, ClientWithTransactions } from "./ClientsTable";
import { ExportDialog } from "./ExportDialog";

export function LedgerView({ 
  transactions,
  clients,
  totalTransactions,
  totalClients
}: { 
  transactions: Transaction[];
  clients: ClientWithTransactions[];
  totalTransactions: number;
  totalClients: number;
}) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'clients'>('ledger');
  const searchParams = useSearchParams();

  // Ledger Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Type: All");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [sortOrder, setSortOrder] = useState("Latest / Newest");

  // Allow the dashboard metric cards to deep-link into a pre-filtered ledger view
  useEffect(() => {
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    if (type === "Income" || type === "Expense") {
      setTypeFilter(type);
      setActiveTab("ledger");
    }
    if (status === "Pending" || status === "Overdue" || status === "Paid" || status === "Partially Paid") {
      setStatusFilter(status);
      setActiveTab("ledger");
    }
  }, [searchParams]);

  // Clients Filter State
  const [clientSearch, setClientSearch] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("Type: All");
  const [clientExpiryFilter, setClientExpiryFilter] = useState("Expiry: All");

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(tx => 
        tx.reference.toLowerCase().includes(q) ||
        tx.counterparty.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q)
      );
    }

    // Type Filter
    if (typeFilter === "Income") {
      result = result.filter(tx => tx.type === "INCOME");
    } else if (typeFilter === "Expense") {
      result = result.filter(tx => tx.type === "EXPENSE");
    }

    // Status Filter
    if (statusFilter === "Paid") {
      result = result.filter(tx => tx.status === "PAID" || (tx.amountTotal - tx.amountPaid <= 0));
    } else if (statusFilter === "Partially Paid") {
      result = result.filter(tx => tx.status === "PARTIALLY_PAID");
    } else if (statusFilter === "Pending") {
      result = result.filter(tx => tx.status === "PENDING" && (tx.amountTotal - tx.amountPaid > 0));
    } else if (statusFilter === "Overdue") {
      result = result.filter(tx => tx.status === "OVERDUE");
    }

    // Sort
    if (sortOrder === "Date" || sortOrder === "Latest / Newest") {
      // `date` alone ties for bulk/seeded rows sharing the same timestamp
      // (e.g. INV-2026-001-A/B/C) -- fall back to createdAt desc so the most
      // recently created record wins the tie instead of Array.sort's
      // unspecified tie order.
      result.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortOrder === "Amount") {
      result.sort((a, b) => b.amountTotal - a.amountTotal);
    } else if (sortOrder === "ID") {
      result.sort((a, b) => b.reference.localeCompare(a.reference));
    }

    return result;
  }, [transactions, search, typeFilter, statusFilter, sortOrder]);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.tradeLicenseNo && c.tradeLicenseNo.toLowerCase().includes(q)) ||
        (c.passportNo && c.passportNo.toLowerCase().includes(q)) ||
        (c.emiratesIdNo && c.emiratesIdNo.toLowerCase().includes(q))
      );
    }

    // Type Filter
    if (clientTypeFilter === "Corporate (B2B)") {
      result = result.filter(c => c.type === "CORPORATE");
    } else if (clientTypeFilter === "Individual (B2C)") {
      result = result.filter(c => c.type === "INDIVIDUAL");
    }

    // Expiry Filter
    if (clientExpiryFilter !== "Expiry: All") {
      result = result.filter(c => {
        const dateStr = c.type === "CORPORATE" ? c.expiryDate : c.passportExpiry;
        if (!dateStr) return false;
        
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        
        if (clientExpiryFilter === "Expiring in 30 Days") return days <= 30;
        if (clientExpiryFilter === "Expiring in 60 Days") return days <= 60;
        return true;
      });
    }

    return result;
  }, [clients, clientSearch, clientTypeFilter, clientExpiryFilter]);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="w-full">
      <CockpitHeader onExport={() => setExportDialogOpen(true)} clients={clients} />
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} transactions={transactions} clients={clients} />

      <div className="flex items-center gap-1 mt-8 mb-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'ledger' 
              ? 'bg-[#0F172A] text-white ' 
              : 'text-slate-500 hover:text-slate-800 '
          }`}>
          Transactions Ledger ({totalTransactions})
        </button>
        <button 
          onClick={() => setActiveTab('clients')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'clients' 
              ? 'bg-[#0F172A] text-white ' 
              : 'text-slate-500 hover:text-slate-800 '
          }`}>
          Clients Directory ({totalClients})
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <div>
          <FilterStrip 
            search={search} setSearch={setSearch}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
          />
          <LedgerTable transactions={filteredTransactions} />
        </div>
      ) : (
        <div>
          <ClientsFilterStrip 
            search={clientSearch} setSearch={setClientSearch}
            typeFilter={clientTypeFilter} setTypeFilter={setClientTypeFilter}
            expiryFilter={clientExpiryFilter} setExpiryFilter={setClientExpiryFilter}
          />
          <ClientsTable clients={filteredClients} />
        </div>
      )}
    </div>
  );
}
