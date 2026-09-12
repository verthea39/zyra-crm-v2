import { Transaction } from '@/types/cockpit';

export type SortField = 'DEFAULT' | 'DATE' | 'ID' | 'AMOUNT' | 'BALANCE';
export type SortOrder = 'asc' | 'desc';

export function sortTransactions(
  data: Transaction[],
  field: SortField,
  order: SortOrder
): Transaction[] {
  if (field === 'DEFAULT') return data;

  return [...data].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'DATE': {
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        const timeA = new Date(yearA, monthA - 1, dayA).getTime();
        const timeB = new Date(yearB, monthB - 1, dayB).getTime();
        comparison = timeA - timeB;
        break;
      }
      case 'ID':
        comparison = a.refId.localeCompare(b.refId, undefined, { numeric: true });
        break;
      case 'AMOUNT':
        comparison = a.total - b.total;
        break;
      case 'BALANCE':
        comparison = a.balance - b.balance;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}
