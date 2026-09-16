"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";

type ClientOption = { id: string; name: string; type?: string; phone?: string | null };

export function ClientCombobox({
  clients,
  value,
  onChange,
  placeholder = "Search clients...",
}: {
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.type || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectClient = (client: ClientOption) => {
    onChange(client.id);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) selectClient(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={isOpen ? query : selected ? `${selected.name}${selected.type ? ` (${selected.type})` : ""}` : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg outline-none transition-all"
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500 italic">No clients found matching &lsquo;{query}&rsquo;</p>
          ) : (
            filtered.map((c, i) => (
              <button
                type="button"
                key={c.id}
                onClick={() => selectClient(c)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex ? "bg-[#98682E]/10" : "hover:bg-slate-50"
                }`}
              >
                <span className="flex flex-col min-w-0">
                  <span className="font-medium text-slate-900 truncate">
                    {c.name} {c.type ? <span className="text-xs text-slate-500 font-normal">({c.type})</span> : null}
                  </span>
                  {c.phone && <span className="text-xs text-slate-400">{c.phone}</span>}
                </span>
                {c.id === value && <Check className="w-4 h-4 text-[#98682E] shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
