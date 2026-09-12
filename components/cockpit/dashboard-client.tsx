'use client';

import { useState, useMemo } from 'react';
import {
  Download,
  BookOpen,
  Users,
  UserPlus,
  Plus,
} from 'lucide-react';
import { KpiSection } from './kpi-section';
import { FilterToolbar } from './filter-toolbar';
import { LedgerTable } from './ledger-table';
import { useCockpitStore } from '@/store/useCockpitStore';
import { Transaction } from '@/types/cockpit';
import TransactionModal from '@/components/cockpit/transaction-modal';
import ClientModal from '@/components/cockpit/client-modal';
import EditTransactionModal from '@/components/cockpit/edit-transaction-modal';
import { useKpiMetrics } from '@/hooks/useKpiMetrics';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { sortTransactions } from '@/lib/finance-sort';

export function DashboardClient({
  initialTransactions,
  clients,
}: {
  initialTransactions: Transaction[];
  clients: { id: string; name: string }[];
}) {
  const { 
    searchQuery, 
    typeFilter, 
    statusFilter,
    sortField,
    sortOrder,
    activeTab,
    setActiveTab,
    userRole
  } = useCockpitStore();
  
  const canMutate = userRole !== 'VIEWER';
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Wrap initial server data with our Supabase Realtime hook
  const liveTransactions = useRealtimeTransactions(initialTransactions);

  const filteredData = useMemo(() => {
    const filtered = liveTransactions.filter((item) => {
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.refId.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return sortTransactions(filtered, sortField, sortOrder);
  }, [liveTransactions, searchQuery, typeFilter, statusFilter, sortField, sortOrder]);

  // Live KPI Calculations based on filtered data
  const liveKPIs = useKpiMetrics(filteredData);

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['REF/ID', 'DATE', 'CLIENT', 'CATEGORY', 'TOTAL (AED)', 'PAID (AED)', 'BALANCE (AED)', 'STATUS', 'DUE DATE', 'TYPE'];
    
    const rows = filteredData.map(t => [
      t.refId,
      t.date,
      `"${t.clientName}"`, // Escape commas
      `"${t.category}"`,
      t.total,
      t.paid,
      t.balance,
      t.status,
      t.dueDate,
      t.type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenModal = (type: 'INCOME' | 'EXPENSE') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-[1550px] mx-auto space-y-7">
        {/* TOP HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="bg-[#0B132B] text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                AED Live Finance
              </span>
              <span className="text-slate-400 text-xs font-medium">Dubai Corporate Standard</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Executive Cash Flow Cockpit
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live bi-directional sync with master ledger & invoicing pipeline
            </p>
          </div>

          {/* TOP ACTIONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'ledger' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                Transactions Ledger ({filteredData.length})
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'clients' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Clients Directory ({clients.length})
              </button>
            </div>

            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition">
              <Download className="w-4 h-4 text-slate-500" />
              Export Data
            </button>

            <button 
              onClick={() => setIsClientModalOpen(true)} 
              disabled={!canMutate}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition ${
                canMutate ? 'bg-[#2563EB] hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              + Add Client
            </button>

            <button 
              onClick={() => handleOpenModal('INCOME')} 
              disabled={!canMutate}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition ${
                canMutate ? 'bg-[#059669] hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              + Add Income
            </button>

            <button 
              onClick={() => handleOpenModal('EXPENSE')} 
              disabled={!canMutate}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition ${
                canMutate ? 'bg-[#E11D48] hover:bg-rose-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              + Add Expense
            </button>
          </div>
        </header>

        <KpiSection data={liveKPIs} />
        
        {activeTab === 'ledger' ? (
          <div>
            <FilterToolbar 
              onExport={handleExportCSV} 
              onAddIncome={() => handleOpenModal('INCOME')}
              onAddExpense={() => handleOpenModal('EXPENSE')}
            />
            <LedgerTable 
              data={filteredData} 
              disableInternalFilter 
              onEdit={(tx) => setEditingTransaction(tx)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Clients & Counterparties Directory</h2>
            <p className="text-slate-500 max-w-md">
              The client directory is currently being built. You have {clients.length} registered clients. Use the Add Client button above to register new corporate or individual entities.
            </p>
          </div>
        )}

        {isModalOpen && (
          <TransactionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            type={modalType}
            clients={clients}
          />
        )}

        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
        />

        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      </div>
    </div>
  );
}
