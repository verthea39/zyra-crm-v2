"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logWhatsAppDispatch(caseId: string, clientId: string, templateType: string, phone: string) {
  try {
    const log = await prisma.whatsAppLog.create({
      data: {
        caseId,
        clientId,
        templateType,
        phone,
      }
    });

    revalidatePath("/client-hub");
    return { success: true, log };
  } catch (error: any) {
    console.error("Error logging WhatsApp dispatch:", error);
    return { success: false, error: error.message || "Failed to log dispatch" };
  }
}

export async function getDispatchHistory() {
  try {
    const logs = await prisma.whatsAppLog.findMany({
      include: {
        client: { select: { name: true } },
        caseFile: { select: { reference: true } },
        sentBy: { select: { name: true } }
      },
      orderBy: { sentAt: 'desc' },
      take: 100
    });
    return logs;
  } catch (error) {
    console.error("Error fetching dispatch history:", error);
    return [];
  }
}

export async function getActiveCasesForHub() {
  try {
    const cases = await prisma.caseFile.findMany({
      where: {
        NOT: { stage: 'COMPLETED_HANDOVER' }
      },
      include: {
        client: { select: { name: true, phone: true } },
        coordinator: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return cases;
  } catch (error) {
    console.error("Error fetching active cases for hub:", error);
    return [];
  }
}
