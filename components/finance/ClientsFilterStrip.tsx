import { Search, Filter } from "lucide-react";

interface ClientsFilterStripProps {
  search: string;
  setSearch: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  expiryFilter: string;
  setExpiryFilter: (s: string) => void;
}

export function ClientsFilterStrip({ 
  search, setSearch,
  typeFilter, setTypeFilter,
  expiryFilter, setExpiryFilter
}: ClientsFilterStripProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-xl border shadow-sm mt-6">
      <div className="relative w-full md:w-96">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search name, phone, trade license, EID..." 
          className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 cursor-pointer"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>Type: All</option>
            <option>Corporate (B2B)</option>
            <option>Individual (B2C)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 py-1 pr-8 cursor-pointer"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
          >
            <option>Expiry: All</option>
            <option>Expiring in 30 Days</option>
            <option>Expiring in 60 Days</option>
          </select>
        </div>
      </div>
    </div>
  );
}
