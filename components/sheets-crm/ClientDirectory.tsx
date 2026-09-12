'use client';

import { useState, useMemo } from 'react';
import { TransactionRow } from '@/app/actions/sheets';
import { Search, Phone, FileText, UserPlus } from 'lucide-react';

interface Props {
  initialRows: TransactionRow[];
}

export function ClientDirectory({ initialRows }: Props) {
  // Filter only rows where type is 'Client'
  const clients = useMemo(() => initialRows.filter(r => r.type === 'Client'), [initialRows]);
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const query = search.toLowerCase();
    return clients.filter(c => 
      c.counterparty.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  }, [clients, search]);

  // Parse structured metadata from description: "Phone: +971... | Visa: Employment"
  const parseMetadata = (desc: string) => {
    const data: Record<string, string> = {};
    if (!desc) return data;
    desc.split('|').forEach(pair => {
      const [k, v] = pair.split(':');
      if (k && v) data[k.trim()] = v.trim();
    });
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or phone..."
            className="pl-9 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors w-full md:w-auto">
          <UserPlus className="w-4 h-4" />
          New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No clients found matching your search.
          </div>
        ) : filteredClients.map((client) => {
          const meta = parseMetadata(client.description);
          return (
            <div key={client.rowIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{client.counterparty}</h3>
                    <p className="text-sm font-mono text-gray-500">{client.id}</p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                    {client.category || 'Client'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {meta['Phone'] && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{meta['Phone']}</span>
                    </div>
                  )}
                  {meta['Visa'] && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{meta['Visa']}</span>
                    </div>
                  )}
                  {meta['EID Expiry'] && (
                    <div className="flex items-center gap-2 text-gray-600 mt-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>EID Exp: <span className="font-medium">{meta['EID Expiry']}</span></span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  View Dossier
                </button>
                <button className="bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:text-blue-700 text-gray-700 px-4 py-1.5 rounded text-sm font-medium transition-colors">
                  + Bill Client
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
