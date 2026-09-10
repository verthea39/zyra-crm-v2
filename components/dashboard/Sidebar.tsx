"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/workflows", label: "PRO Workflows", icon: WorkflowIcon },
  { href: "/field-tasks", label: "Field PRO Tasks", icon: MapPin },
  { href: "/documents", label: "Document Vault", icon: FileText },
  { href: "/quotations", label: "Quotations", icon: FileSignature },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/finance", label: "Finance & Ledger", icon: Landmark },
  {
    label: "Settings",
    icon: Settings,
    subItems: [
      { href: "/services", label: "Services", icon: Briefcase },
      { href: "/staff", label: "Staff", icon: UserPlus },
      { href: "/settings/backup", label: "Backup & Restore", icon: Settings },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside className="hidden w-64 flex-col glass-panel m-4 rounded-xl md:flex shrink-0 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <Link href="/" className="p-6 flex items-center gap-3 border-b border-border/40 relative hover:bg-muted/30 transition-colors">
        <div className="size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/50 bg-black">
          <Image src="/logo-icon.png" alt="Zyra CRM Logo" width={32} height={32} className="object-cover" />
        </div>
        <p className="text-sm font-bold text-foreground tracking-tight">ZYRA CRM</p>
      </Link>

      <nav className="flex-1 overflow-y-auto space-y-1.5 p-4 z-10 custom-scrollbar">
        {navItems.map((item, i) => {
          if (item.subItems) {
            const isExpanded = expanded.includes(item.label);
            const hasActiveChild = item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href));

            return (
              <div key={item.label}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${hasActiveChild && !isExpanded
                        ? "text-primary-foreground shadow-sm shadow-primary/10 bg-primary/90"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </div>
                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1.5 space-y-1.5 pl-9">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname.startsWith(subItem.href));
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${isSubActive
                                  ? "text-primary-foreground shadow-sm shadow-primary/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                            >
                              {isSubActive && (
                                <motion.div
                                  layoutId="sidebar-active"
                                  className="absolute inset-0 bg-primary rounded-lg -z-10"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              <subItem.icon className={`size-4 shrink-0 transition-transform duration-300 ${isSubActive ? "scale-110" : ""}`} />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href!));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <Link
                href={item.href!}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${isActive
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
                <item.icon className={`size-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
