'use client';

import { useCockpitStore } from '@/store/useCockpitStore';
import { Search, Download, BookOpen, Users } from 'lucide-react';

export function FilterToolbar({
  onExport,
  onAddIncome,
  onAddExpense,
}: {
  onExport: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  const {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    toggleSortOrder,
  } = useCockpitStore();

  return (
    <>
      {/* MID NAVIGATION BAR */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-2 mb-4">
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow-sm">
            <BookOpen className="w-4 h-4" />
            Transactions Ledger
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs font-bold transition">
            <Users className="w-4 h-4" />
            Clients Directory
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onExport} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export Ledger
          </button>
          <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" /> View Clients Directory
          </button>
          <button onClick={onAddIncome} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            + Add Income
          </button>
          <button onClick={onAddExpense} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            + Add Expense
          </button>
        </div>
      </section>

      {/* SEARCH & FILTERS CONTAINER */}
      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 mb-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search counterparty, reference ID, category, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700">
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export Data
            </button>
            <button onClick={onAddIncome} className="px-3 py-2 text-xs font-bold rounded-xl bg-[#059669] text-white">
              + Add Income
            </button>
            <button onClick={onAddExpense} className="px-3 py-2 text-xs font-bold rounded-xl bg-[#E11D48] text-white">
              + Add Expense
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Type:</span>
              {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    typeFilter === type
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === status
                      ? status === 'PENDING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sort:</span>
            <button
              onClick={() => { useCockpitStore.getState().setSortField('DEFAULT'); useCockpitStore.getState().handleSort('DEFAULT'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === 'DEFAULT' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Latest / Newest ↓
            </button>
            <button
              onClick={() => useCockpitStore.getState().handleSort('DATE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === 'DATE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Date {sortField === 'DATE' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
            </button>
            <button
              onClick={() => useCockpitStore.getState().handleSort('ID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === 'ID' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ID {sortField === 'ID' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
            </button>
            <button
              onClick={() => useCockpitStore.getState().handleSort('AMOUNT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === 'AMOUNT' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Amount {sortField === 'AMOUNT' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
