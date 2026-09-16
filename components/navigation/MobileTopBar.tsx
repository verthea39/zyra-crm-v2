"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ZYRA_ICON_PATH } from "@/lib/brandAssets";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationsPopover } from "./NotificationsPopover";
import { UserMenuPopover } from "./UserMenuPopover";

export function MobileTopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-40 pt-safe bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 leading-none">
          <img src={ZYRA_ICON_PATH} alt="Zyra" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">ZYRA CRM</span>
            <span className="text-[9px] tracking-widest text-[#98682E] font-bold uppercase">PRO Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full text-slate-600 active:scale-95 active:bg-slate-100 transition-transform"
          >
            <Search className="w-5 h-5" />
          </button>
          <NotificationsPopover />
          <UserMenuPopover />
        </div>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
