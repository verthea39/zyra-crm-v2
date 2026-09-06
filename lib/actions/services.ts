"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function listServices() {
  await requireSession();
  return db.serviceTemplate.findMany({
    orderBy: { name: "asc" },
  });
}
