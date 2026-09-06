"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "CANCELLED";

const nextStatus: Partial<Record<TaskStatus, TaskStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  ACTION_REQUIRED: "IN_PROGRESS",
};

const nextLabel: Partial<Record<TaskStatus, string>> = {
  PENDING: "Start",
  IN_PROGRESS: "Mark complete",
  ACTION_REQUIRED: "Resume",
};

export function TaskStatusButton({ taskId, status }: { taskId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const next = nextStatus[status as TaskStatus];
  if (!next) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => updateTaskStatus(taskId, next))}
    >
      {isPending ? "Updating…" : nextLabel[status as TaskStatus]}
    </Button>
  );
}
