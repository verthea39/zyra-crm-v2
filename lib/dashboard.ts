import { db } from "@/lib/db";
import type { DashboardMetrics, ExpiryAlertRow, FieldTaskRow, ActiveWorkflowRow } from "@/types";

/**
 * Aggregates the four headline KPIs called out in the spec:
 * Total Active Cases, Expiring Visas & Licenses (30/60d), Today's Field
 * PRO Tasks, and Monthly Revenue.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalActiveCases,
    expiringNext30Days,
    expiringNext60Days,
    todaysFieldTasks,
    dailyPayments,
  ] = await Promise.all([
    db.workflow.count({ where: { completedAt: null } }),
    db.document.count({
      where: { expiryDate: { gte: now, lte: in30 } },
    }),
    db.document.count({
      where: { expiryDate: { gte: now, lte: in60 } },
    }),
    db.task.count({
      where: { dueDate: { gte: startOfDay, lt: endOfDay } },
    }),
    db.payment.aggregate({
      _sum: { amountFils: true },
      where: { 
        direction: "IN",
        deletedAt: null,
        occurredAt: { gte: startOfDay, lt: endOfDay } 
      },
    }),
  ]);

  return {
    totalActiveCases,
    expiringNext30Days,
    expiringNext60Days,
    todaysFieldTasks,
    dailyRevenueAED: Number(dailyPayments._sum.amountFils ?? 0) / 100,
  };
}

/** Rows for the Document Vault expiry alerts widget, nearest expiry first. */
export async function getExpiryAlerts(limit = 8): Promise<ExpiryAlertRow[]> {
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const docs = await db.document.findMany({
    where: { expiryDate: { lte: in90 } },
    orderBy: { expiryDate: "asc" },
    take: limit,
    include: {
      client: {
        include: { corporateProfile: true, individualProfile: true },
      },
    },
  });

  return docs.map((doc) => {
    const days = doc.expiryDate
      ? Math.ceil((doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const tier = days < 0 ? "EXPIRED" : days <= 30 ? "DUE_30" : days <= 60 ? "DUE_60" : "DUE_90";
    const clientName =
      doc.client.corporateProfile?.companyNameEn ??
      doc.client.individualProfile?.fullNameEn ??
      "Unknown client";

    return {
      id: doc.id,
      clientId: doc.clientId,
      clientName,
      category: doc.category,
      label: doc.fileName,
      expiryDate: doc.expiryDate?.toISOString() ?? "",
      tier,
    };
  });
}

/** Rows for today's Field PRO task list widget. */
export async function getTodaysFieldTasks(limit = 8): Promise<FieldTaskRow[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await db.task.findMany({
    where: { dueDate: { gte: startOfDay, lt: endOfDay } },
    orderBy: { dueDate: "asc" },
    take: limit,
    include: {
      assignee: true,
      workflowStep: { include: { workflow: { include: { client: {
        include: { corporateProfile: true, individualProfile: true },
      } } } } },
    },
  });

  return tasks.map((task) => {
    const client = task.workflowStep?.workflow.client;
    const clientName =
      client?.corporateProfile?.companyNameEn ??
      client?.individualProfile?.fullNameEn ??
      "—";

    return {
      id: task.id,
      title: task.title,
      venue: task.venue,
      status: task.status,
      assigneeName: task.assignee.name,
      clientName,
      dueTime: task.dueDate?.toISOString(),
      workflowId: task.workflowStep?.workflowId,
    };
  });
}

/** Rows for active workflows widget. */
export async function getActiveWorkflows(limit = 5): Promise<ActiveWorkflowRow[]> {
  const workflows = await db.workflow.findMany({
    where: { completedAt: null },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      client: {
        include: { corporateProfile: true, individualProfile: true },
      },
      steps: true,
    },
  });

  return workflows.map((wf) => {
    const clientName =
      wf.client.corporateProfile?.companyNameEn ??
      wf.client.individualProfile?.fullNameEn ??
      "—";

    const completedSteps = wf.steps.filter((s) => s.status === "COMPLETED").length;

    return {
      id: wf.id,
      name: wf.name,
      clientName,
      totalSteps: wf.steps.length,
      completedSteps,
    };
  });
}
