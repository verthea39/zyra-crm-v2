"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  GitMerge,
  ShieldAlert,
  Building2,
  Landmark,
  MessageSquare,
  Lock,
  Settings,
  FileText,
  BarChart3,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { ZYRA_LOGO_GOLD_PATH } from "@/lib/brandAssets";
import { getInitials, formatRoleLabel, type CurrentUser } from "@/lib/currentUserHelpers";

const NAV_ITEMS = [
  { name: "Daily Operations", href: "/dashboard", icon: LayoutDashboard },
  { name: "Application Pipeline", href: "/pipeline", icon: GitMerge },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Document Vault", href: "/vault", icon: ShieldAlert },
  { name: "B2B Registry", href: "/b2b-registry", icon: Building2 },
  { name: "Portal Wallets", href: "/portal-wallets", icon: Landmark },
  { name: "WhatsApp & Tracking", href: "/client-hub", icon: MessageSquare },
];

export function AppSidebar({ currentUser }: { currentUser: CurrentUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 shrink-0 shadow-sm">
      <div className="p-6 border-b border-border flex flex-col gap-1">
        <img src={ZYRA_LOGO_GOLD_PATH} alt="Zyra" className="h-10 w-auto object-contain" />
        <span className="text-[10px] tracking-widest text-[#98682E] font-bold uppercase">PRO Operations</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                isActive 
                  ? "bg-[#FDF8F0] text-[#98682E] border-r-2 border-[#98682E] font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#98682E]" : ""}`} />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6 pb-2">
          <p className="px-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Executive & Security</p>
        </div>

        <Link
          href="/finance/cockpit"
          className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            pathname.startsWith("/finance/cockpit")
              ? "bg-[#FDF8F0] text-[#98682E] border-r-2 border-[#98682E] font-semibold" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg"
          }`}
        >
          <Lock className={`w-5 h-5 ${pathname.startsWith("/finance/cockpit") ? "text-[#98682E]" : ""}`} />
          Finance & Cockpit
        </Link>

        <Link
          href="/finance/reports"
          className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            pathname.startsWith("/finance/reports")
              ? "bg-[#FDF8F0] text-[#98682E] border-r-2 border-[#98682E] font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg"
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${pathname.startsWith("/finance/reports") ? "text-[#98682E]" : ""}`} />
          Reports & BI
        </Link>

        <div className="pt-6 pb-2">
          <p className="px-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Configuration</p>
        </div>

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            pathname.startsWith("/settings")
              ? "bg-[#FDF8F0] text-[#98682E] border-r-2 border-[#98682E] font-semibold" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname.startsWith("/settings") ? "text-[#98682E]" : ""}`} />
          System Settings
        </Link>
      </nav>

      <SidebarProfileCard currentUser={currentUser} />
    </aside>
  );
}

function SidebarProfileCard({ currentUser }: { currentUser: CurrentUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(currentUser.name);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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
  }, [open]);

  const handleSignOut = () => {
    // No login/session system exists in this app (see lib/currentUser.ts) --
    // there's no server-side session to invalidate and no login screen to
    // redirect to, so this is an honest local "lock" affordance instead of
    // a fake sign-out.
    toast.success("Locked. Refresh or reopen the app to continue.");
    setOpen(false);
    router.push("/dashboard");
  };

  return (
    <div ref={containerRef} className="relative p-4 border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 text-foreground border border-border hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</span>
          <span className="text-xs text-muted-foreground truncate">{formatRoleLabel(currentUser.role)}</span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-auto" />
      </button>

      {open && (
        <div className="absolute left-4 right-4 bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{currentUser.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#98682E]/10 text-[#98682E]">
              {formatRoleLabel(currentUser.role)}
            </span>
          </div>
          <div className="py-1.5">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings className="w-4 h-4 text-slate-400" /> Profile Settings
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
