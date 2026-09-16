"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings, LogOut } from "lucide-react";

export function UserMenuPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = () => {
    // This app has no login/session system (see lib/logger.ts note in
    // admin-tools.ts) -- there's nothing server-side to invalidate, so
    // this just gives the user a clear, honest local affordance.
    toast.success("Locked. Refresh or reopen the app to continue.");
    setOpen(false);
    router.push("/dashboard");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="User profile"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold active:scale-95 transition-transform"
      >
        AD
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">Admin User</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#98682E]/10 text-[#98682E]">
              Admin
            </span>
          </div>
          <div className="py-1.5">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings className="w-4 h-4 text-slate-400" /> Company Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" /> Lock Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
