import { useMemo } from 'react';
import { Transaction, KpiData } from '@/types/cockpit';

export function useKpiMetrics(transactions: Transaction[]): KpiData {
  return useMemo(() => {
    return transactions.reduce<KpiData>(
      (acc, tx) => {
        if (tx.type === 'INCOME') {
          acc.revenue += tx.total;
          acc.receivables += tx.balance;
        } else if (tx.type === 'EXPENSE') {
          acc.totalExpenses += tx.total;
          acc.payables += tx.balance;
        }
        acc.netProfit = acc.revenue - acc.totalExpenses;
        return acc;
      },
      {
        revenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        receivables: 0,
        payables: 0,
      }
    );
  }, [transactions]);
}
