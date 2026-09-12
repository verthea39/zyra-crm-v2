'use client';

import { useState } from 'react';
import { TransactionRow } from '@/app/actions/sheets';
import { TransactionsLedger } from './TransactionsLedger';
import { ClientDirectory } from './ClientDirectory';
import { FileSpreadsheet, Users } from 'lucide-react';

interface Props {
  initialRows: TransactionRow[];
}

export function SheetsCrmCockpit({ initialRows }: Props) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'clients'>('ledger');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Cockpit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time, bi-directional sync with Google Sheets Backend.
          </p>
        </div>
        
        <div className="flex p-1 bg-gray-100/80 backdrop-blur rounded-lg border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'ledger' 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Financial Ledger
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'clients' 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Client Directory
          </button>
        </div>
      </div>

      <div className="pt-2">
        {activeTab === 'ledger' ? (
          <TransactionsLedger initialRows={initialRows} />
        ) : (
          <ClientDirectory initialRows={initialRows} />
        )}
      </div>
    </div>
  );
}
