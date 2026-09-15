"use client";

import { formatDistanceToNow } from "date-fns";
import {
  FileSignature,
  FileText,
  Receipt,
  Wallet,
  UserPlus,
  GitMerge,
  Activity as ActivityIcon,
} from "lucide-react";

export type ActivityItem = {
  id: string;
  action: string;
  title: string;
  entityType: string;
  actorName: string;
  createdAt: string | Date;
};

const ACTION_STYLE: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  QUOTATION_CREATED: { icon: FileSignature, color: "bg-blue-100 text-blue-700", label: "Quotation" },
  QUOTATION_UPDATED: { icon: FileSignature, color: "bg-blue-100 text-blue-700", label: "Quotation" },
  INVOICE_ISSUED: { icon: FileText, color: "bg-[#98682E]/15 text-[#98682E]", label: "Invoice" },
  INVOICE_UPDATED: { icon: FileText, color: "bg-[#98682E]/15 text-[#98682E]", label: "Invoice" },
  RECEIPT_CREATED: { icon: Receipt, color: "bg-slate-200 text-slate-700", label: "Receipt" },
  PAYMENT_RECORDED: { icon: Receipt, color: "bg-emerald-100 text-emerald-700", label: "Payment" },
  STATUS_UPDATED: { icon: GitMerge, color: "bg-purple-100 text-purple-700", label: "Status" },
  CLIENT_ADDED: { icon: UserPlus, color: "bg-sky-100 text-sky-700", label: "Client" },
  WALLET_TOPUP: { icon: Wallet, color: "bg-amber-100 text-amber-700", label: "Wallet" },
  WALLET_DEDUCTION: { icon: Wallet, color: "bg-rose-100 text-rose-700", label: "Wallet" },
};

const formatTime = (date: string | Date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <ActivityIcon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const style = ACTION_STYLE[item.action] || { icon: ActivityIcon, color: "bg-slate-100 text-slate-600", label: item.entityType };
            const Icon = style.icon;
            return (
              <div key={item.id} className="flex items-start gap-2.5 px-1 py-1.5">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${style.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{style.label}</span>
                    <span className="text-[10px] text-slate-300">&bull;</span>
                    <span className="text-[11px] text-muted-foreground">{formatTime(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
