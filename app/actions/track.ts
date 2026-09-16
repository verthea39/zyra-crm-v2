"use server";

import prisma from "@/lib/prisma";

export async function getCasePublicTracking(trackingToken: string) {
  try {
    const caseData = await prisma.caseFile.findUnique({
      where: { trackingToken },
      include: {
        client: {
          select: {
            name: true,
            type: true,
            phone: true,
            vaultDocuments: {
              where: { fileUrl: { not: null } },
              select: { id: true, title: true, category: true, fileUrl: true },
            },
          },
        },
        coordinator: { select: { name: true, email: true } },
        documents: {
          where: { status: 'APPROVED' },
          select: { id: true, title: true }
        },
        billingDocuments: {
          where: { type: { in: ['INVOICE', 'RECEIPT'] } },
          select: { id: true, reference: true, type: true, totalMinor: true },
          orderBy: { createdAt: 'desc' },
        },
      }
    });
    
    return caseData;
  } catch (error) {
    console.error("Error fetching public tracking data:", error);
    return null;
  }
}
