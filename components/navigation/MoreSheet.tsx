"use client";

import Link from "next/link";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  Landmark,
  Building2,
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const MORE_ITEMS = [
  { name: "Portal Wallets", href: "/portal-wallets", icon: Landmark },
  { name: "B2B Registry", href: "/b2b-registry", icon: Building2 },
  { name: "WhatsApp & Tracking", href: "/client-hub", icon: MessageSquare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Reports & BI", href: "/finance/reports", icon: BarChart3 },
];

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="More">
      <div className="flex flex-col gap-1 pb-2">
        {MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center justify-between gap-3 py-3.5 px-1 min-h-[44px] active:bg-slate-50 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800">
                <Icon className="w-5 h-5 text-slate-500" />
                {item.name}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          );
        })}

        <div className="h-px bg-slate-100 my-2" />

        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center justify-between gap-3 py-3.5 px-1 min-h-[44px] active:bg-slate-50 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-slate-800">
            <Settings className="w-5 h-5 text-slate-500" />
            Settings
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>
      </div>
    </BottomSheet>
  );
}
