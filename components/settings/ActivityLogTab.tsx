"use client";

import { ActivityFeed, type ActivityItem } from "@/components/dashboard/ActivityFeed";
import { History } from "lucide-react";

export function ActivityLogTab({ activity = [] }: { activity: ActivityItem[] }) {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" /> Activity Logs / Audit Trail
        </h2>
        <p className="text-sm text-slate-500">
          System-level events -- database backups, bulk imports, client and document updates -- visible to Admins only.
        </p>
      </div>

      <ActivityFeed items={activity} />
    </div>
  );
}
