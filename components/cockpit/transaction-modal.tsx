'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createTransaction } from '@/app/actions/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'INCOME' | 'EXPENSE';
  clients: { id: string; name: string }[];
}

export default function TransactionModal({ isOpen, onClose, type, clients }: Props) {
  const [total, setTotal] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const balance = Math.max(0, total - paid);
  const isIncome = type === 'INCOME';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('type', type);
    await createTransaction(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isIncome ? 'Record New Income' : 'Record New Expense'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Entries immediately sync with Cash Flow Cockpit & AR/AP
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reference ID</label>
              <input
                name="refId"
                required
                placeholder={isIncome ? 'INV-2026-001' : 'EXP-2026-001'}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <input
                name="category"
                required
                placeholder={isIncome ? 'Consulting Services' : 'Office Lease'}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {isIncome ? 'Client / Payer' : 'Vendor / Payee'}
            </label>
            <input
              name="counterpartyName"
              required
              placeholder="e.g. Acme Corp LLC"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Total (AED)</label>
              <input
                name="totalAmount"
                type="number"
                step="0.01"
                required
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Paid (AED)</label>
              <input
                name="paidAmount"
                type="number"
                step="0.01"
                required
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Balance</label>
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
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm ${
                isIncome ? 'bg-[#059669] hover:bg-emerald-700' : 'bg-[#E11D48] hover:bg-rose-700'
              }`}
            >
              {loading ? 'Recording...' : isIncome ? 'Save Income' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
