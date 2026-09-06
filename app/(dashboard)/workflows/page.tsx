import Link from "next/link";
import { Plus } from "lucide-react";
import { listWorkflows } from "@/lib/actions/workflows";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const workflows = await listWorkflows();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">PRO Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Step-progression tracker for Employment Visa, Trade License, and Attestation cases.
          </p>
        </div>
        <Link href="/workflows/new">
          <Button>
            <Plus className="h-4 w-4" /> Start Workflow
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.length === 0 && (
          <p className="text-sm text-muted-foreground">No workflows yet — start one from a client.</p>
        )}
        {workflows.map((wf) => {
          const clientName =
            wf.client.corporateProfile?.companyNameEn ?? wf.client.individualProfile?.fullNameEn ?? "—";
          const done = wf.steps.filter((s) => s.status === "COMPLETED").length;
          const actionRequired = wf.steps.some((s) => s.status === "ACTION_REQUIRED");
          const pct = wf.steps.length ? Math.round((done / wf.steps.length) * 100) : 0;

          return (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}`}
              className="rounded-lg border border-border bg-card p-4 shadow-sm hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-card-foreground">{wf.name}</p>
                  <p className="text-xs text-muted-foreground">{clientName}</p>
                </div>
                {actionRequired && <Badge tone="warning">Action needed</Badge>}
                {!actionRequired && wf.completedAt && <Badge tone="success">Completed</Badge>}
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {done}/{wf.steps.length} steps · started {formatDate(wf.startedAt)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
