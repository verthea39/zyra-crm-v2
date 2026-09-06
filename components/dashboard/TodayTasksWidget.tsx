import { cn } from "@/lib/utils";
import type { FieldTaskRow } from "@/types";
import { MapPin } from "lucide-react";

const statusStyles: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  ACTION_REQUIRED: "bg-warning/10 text-warning",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function TodayTasksWidget({ rows }: { rows: FieldTaskRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-card-foreground">Today&apos;s Field PRO Tasks</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No field tasks scheduled for today.</p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-card-foreground">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {row.venue.replaceAll("_", " ")} · {row.clientName} · {row.assigneeName}
                </p>
              </div>
            </div>
            <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusStyles[row.status])}>
              {row.status.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
