import { formatDate, cn } from "@/lib/utils";
import type { ExpiryAlertRow } from "@/types";
import Link from "next/link";

const tierStyles: Record<ExpiryAlertRow["tier"], string> = {
  EXPIRED: "bg-destructive/10 text-destructive",
  DUE_30: "bg-warning/10 text-warning",
  DUE_60: "bg-primary/10 text-primary",
  DUE_90: "bg-muted text-muted-foreground",
};

const tierLabels: Record<ExpiryAlertRow["tier"], string> = {
  EXPIRED: "Expired",
  DUE_30: "Due in 30 days",
  DUE_60: "Due in 60 days",
  DUE_90: "Due in 90 days",
};

export function ExpiryAlertsWidget({ rows }: { rows: ExpiryAlertRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-card-foreground">Expiring Visas, Licenses & Documents</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nothing expiring in the next 90 days.</p>
        )}
        {rows.map((row) => (
          <Link
            href={`/clients/${row.clientId}`}
            key={row.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-card-foreground">{row.clientName}</p>
              <p className="text-xs text-muted-foreground">
                {row.category.replaceAll("_", " ")} · {row.label}
              </p>
            </div>
            <div className="text-right">
              <span className={cn("rounded-full px-2 py-1 text-xs font-medium", tierStyles[row.tier])}>
                {tierLabels[row.tier]}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.expiryDate)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
