import { create } from 'zustand';
import { SortField, SortOrder } from '@/lib/finance-sort';

export type UserRole = 'VIEWER' | 'FINANCE_OPERATOR' | 'TREASURY_ADMIN';

interface CockpitState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeTab: 'ledger' | 'clients';
  setActiveTab: (tab: 'ledger' | 'clients') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: 'ALL' | 'INCOME' | 'EXPENSE';
  setTypeFilter: (type: 'ALL' | 'INCOME' | 'EXPENSE') => void;
  statusFilter: 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';
  setStatusFilter: (status: 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE') => void;
  sortField: SortField;
  setSortField: (sort: SortField) => void;
  sortOrder: SortOrder;
  toggleSortOrder: () => void;
  handleSort: (field: SortField) => void;
}

export const useCockpitStore = create<CockpitState>((set) => ({
  userRole: 'VIEWER',
  setUserRole: (role) => set({ userRole: role }),
  activeTab: 'ledger',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  typeFilter: 'ALL',
  setTypeFilter: (type) => set({ typeFilter: type }),
  statusFilter: 'ALL',
  setStatusFilter: (status) => set({ statusFilter: status }),
  sortField: 'DEFAULT',
  setSortField: (sort) => set({ sortField: sort }),
  sortOrder: 'desc',
  toggleSortOrder: () => set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
  handleSort: (field) => set((state) => {
    if (state.sortField === field) {
      return { sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' };
    } else {
      return { sortField: field, sortOrder: 'desc' };
    }
  }),
}));
