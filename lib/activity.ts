import prisma from "@/lib/prisma";

export type LogActivityInput = {
  action: string;
  title: string;
  details?: Record<string, unknown>;
  entityType: string;
  entityId?: string;
  actorName?: string;
};

/**
 * Records an entry in the activity feed. Never throws -- a logging failure
 * (or a cold DB connection) must never block or roll back the primary
 * mutation it's attached to, so failures are swallowed and logged to
 * console only.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        title: input.title,
        details: input.details as any,
        entityType: input.entityType,
        entityId: input.entityId,
        actorName: input.actorName || "Admin User",
      },
    });
  } catch (error) {
    console.error("logActivity failed (non-blocking):", error);
  }
}

export async function getRecentActivity(limit = 10) {
  try {
    return await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("getRecentActivity failed:", error);
    return [];
  }
}

export async function getEntityActivity(entityType: string, entityId: string, limit = 20) {
  try {
    return await prisma.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("getEntityActivity failed:", error);
    return [];
  }
}
