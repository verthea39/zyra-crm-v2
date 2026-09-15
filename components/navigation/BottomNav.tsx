"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GitMerge, 
  ShieldAlert,
  Landmark,
  Lock
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pipeline", href: "/pipeline", icon: GitMerge },
  { name: "Vault", href: "/vault", icon: ShieldAlert },
  { name: "Wallets", href: "/portal-wallets", icon: Landmark },
  { name: "Finance", href: "/finance/cockpit", icon: Lock, isSecure: true },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[4rem] min-h-[44px] h-full transition-all active:scale-95 relative ${
                isActive
                  ? "bg-[#FDF8F0] text-[#98682E] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <div className="relative mb-1">
                <Icon className="w-5 h-5" />
                {item.isSecure && (
                  <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center"></span>
                )}
              </div>
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
