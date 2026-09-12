"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";

export async function listAuditLogsAction(limit: number = 100) {
  await requirePermission("users:manage");
  
  return db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
}
