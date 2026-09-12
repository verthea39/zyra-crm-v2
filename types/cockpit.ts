export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface Transaction {
  id: string;
  refId: string;
  type: TransactionType;
  date: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  category: string;
  total: number;
  paid: number;
  balance: number;
  status: TransactionStatus;
  dueDate: string;
}

export interface KpiData {
  revenue: number;
  totalExpenses: number;
  netProfit: number;
  receivables: number;
  payables: number;
}
