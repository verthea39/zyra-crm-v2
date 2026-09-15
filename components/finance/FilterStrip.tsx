import { Search, Filter, ArrowUpDown } from "lucide-react";

interface FilterStripProps {
  search: string;
  setSearch: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sortOrder: string;
  setSortOrder: (s: string) => void;
}

export function FilterStrip({ 
  search, setSearch,
  typeFilter, setTypeFilter,
  statusFilter, setStatusFilter,
  sortOrder, setSortOrder
}: FilterStripProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-xl border shadow-sm mt-6">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search counterparty, ref ID, category..." 
          className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 cursor-pointer"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>Type: All</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Status: All</option>
            <option>Paid</option>
            <option>Partially Paid</option>
            <option>Pending</option>
            <option>Overdue</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 cursor-pointer"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option>Latest / Newest</option>
            <option>Date</option>
            <option>ID</option>
            <option>Amount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
