"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, GitMerge, ScanLine, X } from "lucide-react";
import { AddClientModal } from "@/components/finance/AddClientModal";

export function FAB() {
  const [open, setOpen] = useState(false);
  const [scanClientOpen, setScanClientOpen] = useState(false);
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
    <>
      <div ref={ref} className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] z-40">
        {open && (
          <div className="mb-3 flex flex-col items-end gap-2">
            <Link
              href="/pipeline"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white border border-slate-200 shadow-md rounded-full pl-4 pr-3 h-11 text-sm font-semibold text-slate-700 active:scale-95 transition-transform"
            >
              New Case
              <span className="w-7 h-7 rounded-full bg-[#FDF8F0] text-[#98682E] flex items-center justify-center">
                <GitMerge className="w-4 h-4" />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                // Close the speed-dial immediately so its backdrop/menu
                // doesn't linger behind the scanner modal that opens next.
                setOpen(false);
                setScanClientOpen(true);
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 shadow-md rounded-full pl-4 pr-3 h-11 text-sm font-semibold text-slate-700 active:scale-95 transition-transform"
            >
              Scan to Add Client
              <span className="w-7 h-7 rounded-full bg-[#FDF8F0] text-[#98682E] flex items-center justify-center">
                <ScanLine className="w-4 h-4" />
              </span>
            </button>
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

      <AddClientModal open={scanClientOpen} onOpenChange={setScanClientOpen} autoOpenScanner />
    </>
  );
}
