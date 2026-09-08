"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Workflow as WorkflowIcon,
  FolderLock,
  Receipt,
  MapPinned,
  Briefcase,
  UserPlus,
  FileText,
  MapPin,
  FileSignature,
  Settings,
  Landmark,
  ArrowRightLeft,
  ReceiptText,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/workflows", label: "PRO Workflows", icon: WorkflowIcon },
  { href: "/documents", label: "Document Vault", icon: FileText },
  { href: "/quotations", label: "Quotations", icon: FileSignature },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/finance", label: "Finance & Ledger", icon: Landmark },
  { href: "/field-tasks", label: "Field PRO Tasks", icon: MapPin },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/staff", label: "Staff", icon: UserPlus },
  { href: "/settings/backup", label: "Backup & Restore", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col glass-panel m-4 rounded-xl md:flex shrink-0 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
      
      <Link href="/" className="p-6 flex items-center gap-3 border-b border-border/40 relative hover:bg-muted/30 transition-colors">
        <div className="size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/50 bg-black">
          <Image src="/logo-icon.png" alt="Zyra CRM Logo" width={32} height={32} className="object-cover" />
        </div>
        <p className="text-sm font-bold text-foreground tracking-tight">ZYRA CRM</p>
      </Link>
      <nav className="flex-1 space-y-1.5 p-4 z-10">
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <Link
                href={href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "text-primary-foreground shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`size-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                {label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
