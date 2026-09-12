'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '@/types/cockpit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Note: In production you might want to share this instance, but for the dashboard it's fine here
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useRealtimeTransactions(initialData: Transaction[]) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);

  // Sync state if server-side props change (e.g. from a Server Action reload)
  useEffect(() => {
    setTransactions(initialData);
  }, [initialData]);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        // Our Prisma model is 'LedgerTransaction' so the Postgres table is named exactly that (quoted by Prisma)
        { event: '*', schema: 'public', table: 'LedgerTransaction' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            const newTx: Transaction = {
              id: raw.id,
              refId: raw.referenceId,
              type: raw.type,
              date: new Date(raw.transactionDate).toLocaleDateString('en-GB'),
              clientName: raw.counterpartyName,
              clientPhone: raw.counterpartyPhone || undefined,
              category: raw.category,
              total: Number(raw.totalAmountMinor) / 100,
              paid: Number(raw.paidAmountMinor) / 100,
              balance: (Number(raw.totalAmountMinor) - Number(raw.paidAmountMinor)) / 100,
              status: raw.status,
              dueDate: raw.dueDate ? new Date(raw.dueDate).toLocaleDateString('en-GB') : '—',
            };
            setTransactions((prev) => [newTx, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            setTransactions((prev) =>
              prev.map((item) =>
                item.id === raw.id
                  ? {
                      ...item,
                      clientName: raw.counterpartyName,
                      category: raw.category,
                      total: Number(raw.totalAmountMinor) / 100,
                      paid: Number(raw.paidAmountMinor) / 100,
                      balance: (Number(raw.totalAmountMinor) - Number(raw.paidAmountMinor)) / 100,
                      status: raw.status,
                      dueDate: raw.dueDate ? new Date(raw.dueDate).toLocaleDateString('en-GB') : '—',
                    }
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const raw = payload.old as any;
            setTransactions((prev) => prev.filter((item) => item.id !== raw.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return transactions;
}
