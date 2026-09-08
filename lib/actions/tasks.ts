"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, requireSession, ForbiddenError } from "@/lib/session";
import { can } from "@/lib/rbac";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "CANCELLED";
type TaskVenue = "AMER_CENTER" | "TASHEEL" | "MOHRE" | "ICP_GDRFA" | "EMBASSY" | "MEDICAL_FITNESS" | "E_NOTARY" | "OTHER";

const createTaskSchema = z.object({
  title: z.string().min(2),
  venue: z.string(),
  assigneeId: z.string().min(1),
  workflowStepId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function createTask(formData: FormData) {
  await requirePermission("workflows:assign");
  const parsed = createTaskSchema.parse(Object.fromEntries(formData.entries()));

  await db.task.create({
    data: {
      title: parsed.title,
      venue: parsed.venue,
      assigneeId: parsed.assigneeId,
      workflowStepId: parsed.workflowStepId || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      notes: parsed.notes || null,
      status: "PENDING",
    },
  });

  revalidatePath("/field-tasks");
  revalidatePath("/field-tasks");
  revalidatePath("/");
  redirect("/field-tasks");
}

export async function editTask(taskId: string, formData: FormData) {
  await requirePermission("workflows:assign");
  const parsed = createTaskSchema.parse(Object.fromEntries(formData.entries()));

  await db.task.update({
    where: { id: taskId },
    data: {
      title: parsed.title,
      venue: parsed.venue,
      assigneeId: parsed.assigneeId,
      workflowStepId: parsed.workflowStepId || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/field-tasks");
  revalidatePath("/");
  redirect("/field-tasks");
}

export async function deleteTask(taskId: string) {
  await requirePermission("workflows:assign");
  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/field-tasks");
  revalidatePath("/");
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await requireSession();
  if (!can(session.user.role, "tasks:read:all")) {
    const task = await db.task.findUnique({ where: { id: taskId }, select: { assigneeId: true } });
    if (!task || task.assigneeId !== session.user.id) throw new ForbiddenError();
  }
  await db.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/field-tasks");
  revalidatePath("/");
}

const checkInSchema = z.object({
  taskId: z.string().min(1),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  note: z.string().optional(),
});

export async function checkInToTask(formData: FormData) {
  const session = await requireSession();
  const parsed = checkInSchema.parse(Object.fromEntries(formData.entries()));

  if (!can(session.user.role, "tasks:read:all")) {
    const task = await db.task.findUnique({ where: { id: parsed.taskId }, select: { assigneeId: true } });
    if (!task || task.assigneeId !== session.user.id) throw new ForbiddenError();
  }

  await db.fieldTaskCheckIn.create({
    data: {
      taskId: parsed.taskId,
      userId: session.user.id,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      note: parsed.note || null,
    },
  });

  revalidatePath("/field-tasks");
  revalidatePath("/");
}

export async function listTasks(params: { status?: TaskStatus } = {}) {
  const session = await requireSession();
  const ownOnly = !can(session.user.role, "tasks:read:all");
  return db.task.findMany({
    where: { status: params.status, assigneeId: ownOnly ? session.user.id : undefined },
    include: {
      assignee: true,
      checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
      workflowStep: {
        include: {
          workflow: {
            include: { client: { include: { corporateProfile: true, individualProfile: true } } },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function listWorkflowStepsForTaskPicker() {
  await requirePermission("workflows:assign");
  return db.workflowStep.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS", "ACTION_REQUIRED"] } },
    include: { workflow: { include: { client: { include: { corporateProfile: true, individualProfile: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
