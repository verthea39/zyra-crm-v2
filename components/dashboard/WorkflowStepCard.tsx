"use client";

import { useTransition } from "react";
import { updateWorkflowStep } from "@/lib/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
type StepStatus = "PENDING" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED";

const statusTone: Record<StepStatus, "muted" | "default" | "warning" | "success"> = {
  PENDING: "muted",
  IN_PROGRESS: "default",
  ACTION_REQUIRED: "warning",
  COMPLETED: "success",
};

export function WorkflowStepCard({
  step,
  workflowId,
  staff,
}: {
  step: {
    id: string;
    order: number;
    name: string;
    status: string;
    assigneeId: string | null;
    fee: string | number | null;
    icpGdrfaRefNumber: string | null;
    tasheelRefNumber: string | null;
    mohreTxnNumber: string | null;
  };
  workflowId: string;
  staff: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateWorkflowStep(formData))}
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        isPending && "opacity-60"
      )}
    >
      <input type="hidden" name="stepId" value={step.id} />
      <input type="hidden" name="workflowId" value={workflowId} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-card-foreground">
          {step.order}. {step.name}
        </p>
        <Badge tone={statusTone[step.status as StepStatus]}>{step.status.replaceAll("_", " ")}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Status</Label>
          <Select name="status" defaultValue={step.status} className="h-8 text-xs">
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Assignee</Label>
          <Select name="assigneeId" defaultValue={step.assigneeId ?? ""} className="h-8 text-xs">
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-xs">Fee (AED)</Label>
          <Input
            name="fee"
            type="number"
            step="0.01"
            defaultValue={step.fee ? String(step.fee) : ""}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">ICP / GDRFA ref</Label>
          <Input name="icpGdrfaRefNumber" defaultValue={step.icpGdrfaRefNumber ?? ""} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">Tasheel ref</Label>
          <Input name="tasheelRefNumber" defaultValue={step.tasheelRefNumber ?? ""} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">MOHRE txn #</Label>
          <Input name="mohreTxnNumber" defaultValue={step.mohreTxnNumber ?? ""} className="h-8 text-xs" />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Saving…" : "Save step"}
        </Button>
      </div>
    </form>
  );
}
