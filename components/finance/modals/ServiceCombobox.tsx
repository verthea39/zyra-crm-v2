"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";

type ServiceOption = { name: string; gov: number; pro: number };
type ServiceGroup = { group: string; items: ServiceOption[] };

export function ServiceCombobox({
  presetServices,
  value,
  onSelect,
  onChangeText,
  placeholder = "Search or type a service...",
  inputClassName = "",
}: {
  presetServices: ServiceGroup[];
  value: string;
  onSelect: (service: ServiceOption) => void;
  onChangeText: (text: string) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo(
    () => presetServices.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group }))),
    [presetServices]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presetServices;
    return presetServices
      .map((g) => ({ group: g.group, items: g.items.filter((i) => i.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [presetServices, query]);

  const flatFiltered = useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);

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

  const selectService = (service: ServiceOption) => {
    onSelect(service);
    setQuery("");
    setIsOpen(false);
  };

  const displayValue = isOpen ? query : value === "Custom Service Details" ? "" : value;
  const matchedPreset = allOptions.find((i) => i.name === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[activeIndex]) selectService(flatFiltered[activeIndex]);
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
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChangeText(e.target.value);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-9 pr-3 border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white ${inputClassName}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {flatFiltered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500 italic">
              No catalog match -- keep typing to use as a custom description.
            </p>
          ) : (
            filteredGroups.map((g) => (
              <div key={g.group}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 sticky top-0">
                  {g.group}
                </div>
                {g.items.map((i) => {
                  const flatIdx = flatFiltered.indexOf(i);
                  return (
                    <button
                      type="button"
                      key={i.name}
                      onClick={() => selectService(i)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        flatIdx === activeIndex ? "bg-[#98682E]/10" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 truncate font-medium text-slate-900">{i.name}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 font-mono">AED {(i.gov + i.pro).toFixed(2)}</span>
                        {i.name === value && <Check className="w-4 h-4 text-[#98682E]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      {!isOpen && value && !matchedPreset && value !== "Custom Service Details" && (
        <p className="text-[11px] text-slate-400 mt-1 pl-1">Custom service -- not in catalog.</p>
      )}
    </div>
  );
}
