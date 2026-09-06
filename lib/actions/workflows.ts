"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, requireSession, ForbiddenError } from "@/lib/session";
import { can } from "@/lib/rbac";
type StepStatus = "PENDING" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED";

export async function listServiceTemplates() {
  await requirePermission("workflows:read");
  return db.serviceTemplate.findMany({
    include: { stepDefs: { orderBy: { order: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function listWorkflows(params: { activeOnly?: boolean } = {}) {
  await requirePermission("workflows:read");
  return db.workflow.findMany({
    where: params.activeOnly ? { completedAt: null } : undefined,
    include: {
      steps: { orderBy: { order: "asc" } },
      client: { include: { corporateProfile: true, individualProfile: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkflow(id: string) {
  await requirePermission("workflows:read");
  return db.workflow.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" }, include: { assignee: true, tasks: true } },
      client: { include: { corporateProfile: true, individualProfile: true } },
    },
  });
}

const createWorkflowSchema = z.object({
  clientId: z.string().min(1),
  templateId: z.string().min(1),
});

export async function createWorkflowFromTemplate(formData: FormData) {
  await requirePermission("workflows:write");
  const { clientId, templateId } = createWorkflowSchema.parse(
    Object.fromEntries(formData.entries())
  );

  const template = await db.serviceTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { stepDefs: { orderBy: { order: "asc" } } },
  });

  const workflow = await db.workflow.create({
    data: {
      clientId,
      templateId,
      name: template.name,
      category: template.category,
      steps: {
        create: template.stepDefs.map((step) => ({
          order: step.order,
          name: step.name,
          status: "PENDING",
        })),
      },
    },
  });

  revalidatePath("/workflows");
  redirect(`/workflows/${workflow.id}`);
}

const updateStepSchema = z.object({
  stepId: z.string().min(1),
  workflowId: z.string().min(1),
  status: z.string(),
  assigneeId: z.string().optional(),
  fee: z.string().optional(),
  icpGdrfaRefNumber: z.string().optional(),
  tasheelRefNumber: z.string().optional(),
  mohreTxnNumber: z.string().optional(),
});

export async function updateWorkflowStep(formData: FormData) {
  const session = await requireSession();
  const parsed = updateStepSchema.parse(Object.fromEntries(formData.entries()));
  const canManage = can(session.user.role, "workflows:write");

  if (!canManage) {
    // Field agents may only update refs/status on a step assigned to them — not reassign or reprice.
    const step = await db.workflowStep.findUnique({ where: { id: parsed.stepId }, select: { assigneeId: true } });
    if (!step || step.assigneeId !== session.user.id) throw new ForbiddenError();
  }

  await db.workflowStep.update({
    where: { id: parsed.stepId },
    data: {
      status: parsed.status,
      ...(canManage
        ? {
            assigneeId: parsed.assigneeId || null,
            fee: parsed.fee ? parseFloat(parsed.fee) : null,
          }
        : {}),
      icpGdrfaRefNumber: parsed.icpGdrfaRefNumber || null,
      tasheelRefNumber: parsed.tasheelRefNumber || null,
      mohreTxnNumber: parsed.mohreTxnNumber || null,
      completedAt: parsed.status === "COMPLETED" ? new Date() : null,
    },
  });

  // If every step on the workflow is now completed, mark the workflow done.
  const steps = await db.workflowStep.findMany({ where: { workflowId: parsed.workflowId } });
  const allDone = steps.every((s) => s.status === "COMPLETED");
  await db.workflow.update({
    where: { id: parsed.workflowId },
    data: { completedAt: allDone ? new Date() : null },
  });

  revalidatePath(`/workflows/${parsed.workflowId}`);
  revalidatePath("/workflows");
}

export async function listStaffUsers() {
  await requireSession();
  return db.user.findMany({
    where: { role: { name: { in: ["PRO_AGENT", "OPERATIONS_MANAGER", "SUPER_ADMIN"] } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function deleteWorkflow(id: string) {
  await requirePermission("workflows:write");
  await db.workflow.delete({ where: { id } });
  revalidatePath("/workflows");
  redirect("/workflows");
}

export async function updateWorkflow(id: string, formData: FormData) {
  await requirePermission("workflows:write");
  const raw = Object.fromEntries(formData.entries());
  // Basic update for workflow details like name
  const updateData: any = {};
  if (raw.name) updateData.name = raw.name as string;
  
  if (Object.keys(updateData).length > 0) {
    await db.workflow.update({
      where: { id },
      data: updateData,
    });
  }
  revalidatePath(`/workflows/${id}`);
  revalidatePath("/workflows");
}
