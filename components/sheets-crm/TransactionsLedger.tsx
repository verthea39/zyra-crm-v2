'use client';

import { useState, useMemo } from 'react';
import { TransactionRow, updateTransactionStatus, deleteTransaction } from '@/app/actions/sheets';
import { Search, Trash2, Edit3, Loader2 } from 'lucide-react';
import { formatAED } from '@/lib/utils'; // Assuming this exists from previous dashboard

interface Props {
  initialRows: TransactionRow[];
}

export function TransactionsLedger({ initialRows }: Props) {
  const [rows, setRows] = useState<TransactionRow[]>(initialRows);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const stats = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    let ar = 0;
    let ap = 0;

    rows.forEach((r) => {
      const amt = Number(r.amount) || 0;
      const isPending = r.status === 'Pending' || r.status === 'Overdue';
      if (r.type === 'Income') {
        revenue += amt;
        if (isPending) ar += amt;
      } else if (r.type === 'Expense') {
        expenses += amt;
        if (isPending) ap += amt;
      }
    });

    return { revenue, expenses, profit: revenue - expenses, ar, ap };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        return (
          r.counterparty.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rows, search, typeFilter, statusFilter]);

  const cycleStatus = async (rowIndex: number, currentStatus: string) => {
    setLoadingRowId(rowIndex);
    const nextStatus =
      currentStatus === 'Paid' ? 'Pending' : currentStatus === 'Pending' ? 'Overdue' : 'Paid';
    
    // Optimistic UI update
    setRows((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: nextStatus } : r)));
    
    const res = await updateTransactionStatus(rowIndex, nextStatus);
    if (!res.success) {
      // Revert on failure
      setRows((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: currentStatus } : r)));
      alert('Failed to update status on Google Sheets');
    }
    setLoadingRowId(null);
  };

  const handleDelete = async (rowIndex: number) => {
    if (!confirm('Are you sure you want to permanently delete this row from the Google Sheet?')) return;
    
    setLoadingRowId(rowIndex);
    const res = await deleteTransaction(rowIndex);
    if (res.success) {
      setRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex));
    } else {
      alert('Failed to delete row from Google Sheets');
    }
    setLoadingRowId(null);
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Billed Revenue" value={stats.revenue} color="text-emerald-600" />
        <MetricCard title="Total Expenses" value={stats.expenses} color="text-rose-600" />
        <MetricCard 
          title="Net Profit" 
          value={stats.profit} 
          color={stats.profit >= 0 ? "text-emerald-600" : "text-rose-600"} 
        />
        <MetricCard title="Accounts Rec. (AR)" value={stats.ar} color="text-amber-600" />
        <MetricCard title="Accounts Pay. (AP)" value={stats.ap} color="text-rose-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search counterparties, IDs..."
            className="pl-9 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <select 
            className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600">Counterparty</th>
              <th className="p-4 font-medium text-gray-600">Category</th>
              <th className="p-4 font-medium text-gray-600">Amount</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No transactions found</td></tr>
            ) : filteredRows.map((row) => (
              <tr key={row.rowIndex} className={`hover:bg-gray-50 transition-colors ${
                row.type === 'Income' && row.status !== 'Paid' ? 'bg-amber-50/30' : 
                row.type === 'Expense' && row.status !== 'Paid' ? 'bg-rose-50/30' : ''
              }`}>
                <td className="p-4 font-mono text-gray-600">{row.id}</td>
                <td className="p-4 whitespace-nowrap">{row.date}</td>
                <td className="p-4 font-medium">{row.counterparty}</td>
                <td className="p-4 text-gray-600">{row.category}</td>
                <td className="p-4 font-mono font-medium">
                  <span className={row.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}>
                    {row.type === 'Income' ? '+' : '-'}{formatAED(row.amount)}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => cycleStatus(row.rowIndex, row.status)}
                    disabled={loadingRowId === row.rowIndex}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' :
                      row.status === 'Overdue' ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' :
                      'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    {loadingRowId === row.rowIndex ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                    {row.status || 'Unknown'}
                  </button>
                </td>
                <td className="p-4 flex justify-end gap-2 text-gray-400">
                  <button className="hover:text-blue-600 transition-colors" title="Edit row (coming soon)"><Edit3 className="w-4 h-4" /></button>
                  <button 
                    className="hover:text-rose-600 transition-colors" 
                    title="Delete permanently"
                    onClick={() => handleDelete(row.rowIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</span>
      <span className={`text-xl font-bold mt-2 font-mono ${color}`}>{formatAED(value)}</span>
    </div>
  );
}
