"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Clock, PieChart, Activity, CheckCheck } from "lucide-react";
import { getNotifications, type NotificationItem } from "@/app/actions/notifications";

const KIND_ICON = { EXPIRY: Clock, QUOTA: PieChart, ACTIVITY: Activity };
const KIND_COLOR = {
  EXPIRY: "bg-amber-100 text-amber-700",
  QUOTA: "bg-purple-100 text-purple-700",
  ACTIVITY: "bg-sky-100 text-sky-700",
};

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotifications().then(setItems);
  }, []);

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

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-11 h-11 rounded-full text-slate-600 active:scale-95 active:bg-slate-100 transition-transform"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border border-white rounded-full" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            <button
              onClick={() => setReadIds(new Set(items.map((i) => i.id)))}
              className="flex items-center gap-1 text-xs font-semibold text-[#98682E] hover:text-[#7D5321]"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
            ) : (
              items.map((item) => {
                const Icon = KIND_ICON[item.kind];
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 last:border-b-0 ${isRead ? "opacity-50" : ""}`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${KIND_COLOR[item.kind]}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800 leading-snug">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
