"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems } from "./Sidebar";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-[9999] md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-border/50">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/50 bg-black">
                  <Image src="/logo-icon.png" alt="Zyra CRM Logo" width={32} height={32} className="object-cover" />
                </div>
                <p className="text-sm font-semibold text-foreground tracking-tight">ZYRA CRM</p>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className={`size-5 shrink-0 ${isActive ? "scale-110" : ""}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="size-5" />
      </button>
      {mounted && typeof document !== "undefined" && createPortal(menuContent, document.body)}
    </>
  );
}
