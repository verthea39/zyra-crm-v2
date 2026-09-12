'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/app/actions/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientModal({ isOpen, onClose }: Props) {
  const [profileType, setProfileType] = useState<'CORPORATE' | 'INDIVIDUAL'>('CORPORATE');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('profileType', profileType);
    await createClient(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose entity profile structure</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setProfileType('CORPORATE')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              profileType === 'CORPORATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Corporate Profile
          </button>
          <button
            type="button"
            onClick={() => setProfileType('INDIVIDUAL')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              profileType === 'INDIVIDUAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Individual Profile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {profileType === 'CORPORATE' ? 'Company / Trade Name' : 'Full Name'}
            </label>
            <input
              name="name"
              required
              placeholder={profileType === 'CORPORATE' ? 'Al Futtaim Group' : 'Ahmed Bin Saeed'}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              name="phone"
              placeholder="+971 50 123 4567"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="finance@company.ae"
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm"
            >
              {loading ? 'Saving...' : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
