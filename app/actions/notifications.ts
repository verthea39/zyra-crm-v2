"use server";

import prisma from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  kind: "EXPIRY" | "QUOTA" | "ACTIVITY";
  title: string;
  detail: string;
  createdAt: string;
};

export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const now = new Date();
    const next30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [expiringDocs, corporates, recentActivity] = await Promise.all([
      prisma.documentVault.findMany({
        where: { expiryDate: { lte: next30d, gte: now } },
        include: { client: true },
        orderBy: { expiryDate: "asc" },
        take: 5,
      }),
      prisma.client.findMany({
        where: { type: "CORPORATE" },
        include: { employees: { select: { id: true } } },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const notifications: NotificationItem[] = [];

    for (const doc of expiringDocs) {
      const daysLeft = Math.ceil((new Date(doc.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `expiry-${doc.id}`,
        kind: "EXPIRY",
        title: `${doc.category} expiring in ${daysLeft}d`,
        detail: `${doc.title}${doc.client ? ` • ${doc.client.name}` : ""}`,
        createdAt: doc.expiryDate!.toISOString(),
      });
    }

    for (const corp of corporates) {
      const used = corp.employees.length;
      const total = corp.mohreQuotaTotal ?? 20;
      if (total > 0 && used / total >= 0.8) {
        notifications.push({
          id: `quota-${corp.id}`,
          kind: "QUOTA",
          title: `MOHRE quota at ${Math.round((used / total) * 100)}%`,
          detail: `${corp.name} • ${used}/${total} slots used`,
          createdAt: now.toISOString(),
        });
      }
    }

    for (const entry of recentActivity) {
      notifications.push({
        id: `activity-${entry.id}`,
        kind: "ACTIVITY",
        title: entry.title,
        detail: entry.entityType,
        createdAt: entry.createdAt.toISOString(),
      });
    }

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}
