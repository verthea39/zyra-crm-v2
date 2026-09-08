import Link from "next/link";
import { Plus, MapPin, Edit } from "lucide-react";
import { listTasks, deleteTask } from "@/lib/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/DeleteButton";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { TaskStatusButton } from "@/components/dashboard/TaskStatusButton";
import { formatDate } from "@/lib/utils";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "CANCELLED";

const statusTone: Record<TaskStatus, "muted" | "default" | "warning" | "success" | "destructive"> = {
  PENDING: "muted",
  IN_PROGRESS: "default",
  ACTION_REQUIRED: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function FieldTasksPage() {
  const tasks = await listTasks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Field PRO Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Dispatch checklist for Amer Centers, Tasheel, MOHRE, ICP, Embassies, Medical Fitness
            Centers.
          </p>
        </div>
        <Link href="/field-tasks/new">
          <Button>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">No field tasks yet.</p>}
        {tasks.map((task) => {
          const clientName =
            task.workflowStep?.workflow.client.corporateProfile?.companyNameEn ??
            task.workflowStep?.workflow.client.individualProfile?.fullNameEn ??
            null;
          const lastCheckIn = task.checkIns[0];

          return (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-card-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.venue.replaceAll("_", " ")}
                    {clientName && ` · ${clientName}`} · {task.assignee.name}
                    {task.dueDate && ` · due ${formatDate(task.dueDate)}`}
                  </p>
                  {lastCheckIn && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last check-in: {formatDate(lastCheckIn.createdAt)}
                      {lastCheckIn.note && ` — ${lastCheckIn.note}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                <Badge tone={statusTone[task.status as TaskStatus]}>{task.status.replaceAll("_", " ")}</Badge>
                <TaskStatusButton taskId={task.id} status={task.status} />
                <Link href={`/field-tasks/${task.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <DeleteButton onDelete={deleteTask.bind(null, task.id)} itemName="this task" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
