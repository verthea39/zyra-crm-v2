import { notFound } from "next/navigation";
import { getWorkflow, listStaffUsers, deleteWorkflow } from "@/lib/actions/workflows";
import { WorkflowStepCard } from "@/components/dashboard/WorkflowStepCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workflow, staff] = await Promise.all([getWorkflow(id), listStaffUsers()]);
  if (!workflow) notFound();

  const clientName =
    workflow.client.corporateProfile?.companyNameEn ??
    workflow.client.individualProfile?.fullNameEn ??
    "—";

  const done = workflow.steps.filter((s) => s.status === "COMPLETED").length;
  
  const deleteAction = async () => {
    "use server";
    await deleteWorkflow(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{workflow.name}</h1>
          <p className="text-sm text-muted-foreground">
            {clientName} · started {formatDate(workflow.startedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={workflow.completedAt ? "success" : "default"}>
            {workflow.completedAt ? "Completed" : `${done}/${workflow.steps.length} steps done`}
          </Badge>
          <DeleteButton onDelete={deleteAction} itemName="this workflow" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workflow.steps.map((step) => (
          <WorkflowStepCard
            key={step.id}
            step={{ ...step, fee: step.fee ? step.fee.toString() : null }}
            workflowId={workflow.id}
            staff={staff}
          />
        ))}
      </div>
    </div>
  );
}
