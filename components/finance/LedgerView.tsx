"use client";

import { useState, useMemo } from "react";
import { Transaction } from "@prisma/client";
import { FilterStrip } from "./FilterStrip";
import { LedgerTable } from "./LedgerTable";
import { CockpitHeader } from "./CockpitHeader";
import { ClientsFilterStrip } from "./ClientsFilterStrip";
import { ClientsTable, ClientWithTransactions } from "./ClientsTable";
import { toast } from "sonner";

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

  // Ledger Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Type: All");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [sortOrder, setSortOrder] = useState("Latest / Newest");

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
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const handleExport = () => {
    let headers: string[];
    let rows: string[][];
    let filename: string;

    if (activeTab === 'ledger') {
      headers = [
        "Reference ID", 
        "Transaction Date", 
        "Client / Counterparty", 
        "Transaction Type", 
        "Category", 
        "Government Fees (AED)", 
        "Service Fees (AED)", 
        "Total Amount (AED)", 
        "Paid Amount (AED)", 
        "Balance (AED)", 
        "Status", 
        "Due Date"
      ];
      rows = filteredTransactions.map(tx => [
        tx.reference,
        new Date(tx.date).toISOString().split('T')[0],
        `"${tx.counterparty}"`,
        tx.type === "INCOME" ? "Income" : "Expense",
        `"${tx.category}"`,
        ((tx.govFeePart || 0) / 100).toFixed(2),
        ((tx.serviceFeePart || 0) / 100).toFixed(2),
        (tx.amountTotal / 100).toFixed(2),
        (tx.amountPaid / 100).toFixed(2),
        ((tx.amountTotal - tx.amountPaid) / 100).toFixed(2),
        tx.status,
        tx.dueDate ? new Date(tx.dueDate).toISOString().split('T')[0] : ""
      ]);
      filename = `Zyra_Transactions_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = [
        "Client ID", 
        "Client Name", 
        "Type", 
        "Phone", 
        "Place", 
        "Visa / License Type", 
        "Expiry Date", 
        "Total Billed (AED)", 
        "Outstanding Balance (AED)"
      ];
      rows = filteredClients.map(c => {
        let totalBilled = 0;
        let outstanding = 0;
        c.transactions.forEach(tx => {
          if (tx.type === "INCOME") {
            totalBilled += tx.amountTotal;
            outstanding += (tx.amountTotal - tx.amountPaid);
          }
        });

        const expiryDate = c.type === 'CORPORATE' ? c.expiryDate : c.passportExpiry;

        return [
          c.id.substring(0, 11).toUpperCase(),
          `"${c.name}"`,
          c.type,
          c.phone || "",
          c.place || "",
          c.type === 'CORPORATE' ? 'Trade License' : (c.visaType || ""),
          expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : "",
          (totalBilled / 100).toFixed(2),
          (outstanding / 100).toFixed(2)
        ];
      });
      filename = `Zyra_Clients_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export completed successfully");
  };

  return (
    <div className="w-full">
      <CockpitHeader onExport={handleExport} clients={clients} />
      
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
