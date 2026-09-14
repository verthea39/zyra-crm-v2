"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GitMerge, 
  ShieldAlert, 
  Building2, 
  Landmark, 
  MessageSquare,
  Lock,
  Settings
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Daily Operations", href: "/dashboard", icon: LayoutDashboard },
  { name: "Application Pipeline", href: "/pipeline", icon: GitMerge },
  { name: "Document Vault", href: "/vault", icon: ShieldAlert },
  { name: "B2B Registry", href: "/b2b-registry", icon: Building2 },
  { name: "Portal Wallets", href: "/portal-wallets", icon: Landmark },
  { name: "WhatsApp & Tracking", href: "/client-hub", icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 shrink-0 shadow-sm">
      <div className="p-6 border-b border-border flex flex-col gap-1">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">ZYRA CRM</h1>
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

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 text-foreground border border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Admin User</span>
            <span className="text-xs text-muted-foreground">PRO Coordinator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
