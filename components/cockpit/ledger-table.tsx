'use client';

import { Transaction } from '@/types/cockpit';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { deleteTransaction } from '@/app/actions/finance';
import { useCockpitStore } from '@/store/useCockpitStore';
import SendReminderButton from './send-reminder-button';
import { cn } from '@/lib/utils';

interface LedgerTableProps {
  data: Transaction[];
  disableInternalFilter?: boolean;
  onEdit?: (transaction: Transaction) => void;
}

export function LedgerTable({ data, onEdit }: LedgerTableProps) {
  const { sortField, sortOrder, handleSort, userRole } = useCockpitStore();
  
  const canMutate = userRole !== 'VIEWER';

  const formatAED = (amount: number) =>
    `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDelete = async (id: string, refId: string) => {
    if (window.confirm(`Are you sure you want to delete transaction ${refId}?`)) {
      await deleteTransaction(id);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
      <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-black tracking-wider uppercase text-slate-800">
            Transactions Ledger ({data.length})
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          Latest / last added records first by default • Click column headers to reorder
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-[#0B132B] text-white text-[11px] font-bold tracking-wider uppercase select-none">
              <th onClick={() => handleSort('ID')} className="py-3 px-4 cursor-pointer hover:text-blue-300">
                REF / ID {sortField === 'ID' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
              </th>
              <th onClick={() => handleSort('DATE')} className="py-3 px-4 cursor-pointer hover:text-blue-300">
                DATE {sortField === 'DATE' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
              </th>
              <th className="py-3 px-4">CLIENT / COUNTERPARTY</th>
              <th className="py-3 px-4">CATEGORY</th>
              <th onClick={() => handleSort('AMOUNT')} className="py-3 px-4 cursor-pointer hover:text-blue-300 text-right">
                TOTAL (AED) {sortField === 'AMOUNT' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
              </th>
              <th className="py-3 px-4 text-right">PAID (AED)</th>
              <th onClick={() => handleSort('BALANCE')} className="py-3 px-4 cursor-pointer hover:text-blue-300 text-right">
                BALANCE (AED) {sortField === 'BALANCE' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
              </th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">DUE DATE</th>
              <th className="py-3 px-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {data.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{tx.refId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">{tx.date}</td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{tx.clientName}</div>
                  {tx.clientPhone && (
                    <div className="text-[11px] text-slate-400 font-mono">{tx.clientPhone}</div>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {tx.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-black text-slate-900 text-right">
                  {formatAED(tx.total)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                    ✓ {formatAED(tx.paid)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                    ◔ {formatAED(tx.balance)}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      tx.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : tx.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tx.status === 'PENDING' ? '◔ Pending' : tx.status === 'OVERDUE' ? '! Overdue' : '✓ Paid'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">{tx.dueDate}</td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <SendReminderButton 
                      transactionId={tx.id} 
                      hasPhone={!!tx.clientPhone} 
                      hasEmail={!!tx.clientEmail} 
                    />
                    <button 
                      onClick={() => onEdit && onEdit(tx)}
                      disabled={!canMutate}
                      className={`p-1 rounded-lg transition ${
                        canMutate ? 'hover:bg-slate-100 hover:text-slate-700' : 'opacity-30 cursor-not-allowed'
                      }`} 
                      title="Edit Transaction"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(tx.id, tx.refId)}
                      disabled={!canMutate}
                      className={`p-1 rounded-lg transition ${
                        canMutate ? 'hover:bg-slate-100 hover:text-rose-600' : 'opacity-30 cursor-not-allowed'
                      }`} 
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-500 font-medium">
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
