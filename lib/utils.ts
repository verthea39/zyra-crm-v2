import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAED(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "AED 0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "AED 0.00";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(num);
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function expiryTier(date: Date | string | undefined | null): "EXPIRED" | "DUE_30" | "DUE_60" | "DUE_90" | "OK" {
  if (!date) return "OK";
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 30) return "DUE_30";
  if (diffDays <= 60) return "DUE_60";
  if (diffDays <= 90) return "DUE_90";
  return "OK";
}
