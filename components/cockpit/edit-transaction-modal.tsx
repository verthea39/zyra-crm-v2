'use client';

import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { updateTransaction, deleteTransaction } from '@/app/actions/finance';
import { Transaction } from '@/types/cockpit';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditTransactionModal({ transaction, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(transaction?.total || 0);
  const [paid, setPaid] = useState(transaction?.paid || 0);

  // Update local state when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setTotal(transaction.total);
      setPaid(transaction.paid);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const balance = Math.max(0, total - paid);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateTransaction(transaction.id, formData);
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${transaction.refId}?`)) return;
    setLoading(true);
    await deleteTransaction(transaction.id);
    setLoading(false);
    onClose();
  };

  // Convert "12-10-2026" formatted string back to "yyyy-MM-dd" if possible, for the date input
  let formattedDueDate = '';
  if (transaction.dueDate && transaction.dueDate !== '—') {
    const parts = transaction.dueDate.split('-');
    if (parts.length === 3) {
      // Assuming DD-MM-YYYY based on previous mock data "12-09-2026"
      formattedDueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Edit Transaction</h2>
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {transaction.refId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Modify record entries or payment status</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Counterparty Name</label>
              <input
                name="counterpartyName"
                defaultValue={transaction.clientName}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <input
                name="category"
                defaultValue={transaction.category}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Total (AED)</label>
              <input
                type="number"
                step="0.01"
                name="totalAmount"
                defaultValue={transaction.total}
                required
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Paid (AED)</label>
              <input
                type="number"
                step="0.01"
                name="paidAmount"
                defaultValue={transaction.paid}
                required
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Computed Balance</label>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200">
                AED {balance.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={formattedDueDate}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Entry
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              >
                {loading ? 'Saving...' : 'Update Record'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
