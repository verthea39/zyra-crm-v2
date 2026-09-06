import Link from "next/link";
import { WorkflowIcon } from "lucide-react";
import type { ActiveWorkflowRow } from "@/types";

export function ActiveWorkflowsWidget({ rows }: { rows: ActiveWorkflowRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
          <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
          PRO Workflows
        </h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No active workflows.</p>
        )}
        {rows.map((row) => (
          <Link
            href={`/workflows/${row.id}`}
            key={row.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-card-foreground">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.clientName}
              </p>
            </div>
            <div className="text-right">
              <span className="rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                {row.completedSteps}/{row.totalSteps} steps
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
