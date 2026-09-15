"use client";

import { Bell, Search } from "lucide-react";

export function MobileTopBar() {
  return (
    <header className="md:hidden sticky top-0 z-40 pt-safe bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">ZYRA CRM</span>
          <span className="text-[9px] tracking-widest text-[#98682E] font-bold uppercase">PRO Operations</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            className="flex items-center justify-center w-11 h-11 rounded-full text-slate-600 active:scale-95 active:bg-slate-100 transition-transform"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            aria-label="Notifications"
            className="relative flex items-center justify-center w-11 h-11 rounded-full text-slate-600 active:scale-95 active:bg-slate-100 transition-transform"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border border-white rounded-full" />
          </button>
          <button
            aria-label="User profile"
            className="ml-1 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold active:scale-95 transition-transform"
          >
            AD
          </button>
        </div>
      </div>
    </header>
  );
}
