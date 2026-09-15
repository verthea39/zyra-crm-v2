"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, GitMerge, Building2, X } from "lucide-react";

const QUICK_ACTIONS = [
  { name: "New Case", href: "/pipeline", icon: GitMerge },
  { name: "New Corporate Client", href: "/b2b-registry", icon: Building2 },
];

export function FAB() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] z-40">
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 bg-white border border-slate-200 shadow-md rounded-full pl-4 pr-3 h-11 text-sm font-semibold text-slate-700 active:scale-95 transition-transform"
              >
                {action.name}
                <span className="w-7 h-7 rounded-full bg-[#FDF8F0] text-[#98682E] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <button
        aria-label={open ? "Close quick actions" : "Quick add"}
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-[#98682E] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
