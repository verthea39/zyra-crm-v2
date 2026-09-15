"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";

export async function getCases() {
  try {
    const cases = await prisma.caseFile.findMany({
      include: {
        client: {
          select: { name: true, type: true, visaType: true, phone: true }
        },
        coordinator: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return cases;
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

export async function advanceCaseStage(caseId: string, newStage: string) {
  try {
    const existing = await prisma.caseFile.findUnique({
      where: { id: caseId },
      select: { stage: true, reference: true, client: { select: { name: true } } },
    });

    const updatedCase = await prisma.caseFile.update({
      where: { id: caseId },
      data: {
        stage: newStage as any,
        stageUpdatedAt: new Date()
      }
    });
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    if (existing) {
      await logActivity({
        action: "STATUS_UPDATED",
        title: `Case ${existing.reference} (${existing.client?.name || "Unknown Client"}) moved to ${newStage}`,
        details: { caseId, previousStage: existing.stage, newStage },
        entityType: "CASE",
        entityId: caseId,
      });
    }

    return { success: true, case: updatedCase };
  } catch (error) {
    console.error("Error updating case stage:", error);
    return { success: false, error: "Failed to update case stage" };
  }
}

export async function updateCaseGovRef(caseId: string, refType: 'mohreAppNo' | 'gdrfaRequestNo', refValue: string) {
  try {
    const updatedCase = await prisma.caseFile.update({
      where: { id: caseId },
      data: {
        [refType]: refValue
      }
    });
    revalidatePath("/pipeline");
    return { success: true, case: updatedCase };
  } catch (error) {
    console.error("Error updating gov ref:", error);
    return { success: false, error: "Failed to update government reference" };
  }
}

export async function createCase(data: {
  applicantName: string;
  clientId: string;
  serviceType: string;
  coordinatorId: string;
}) {
  try {
    const reference = `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase = await prisma.caseFile.create({
      data: {
        reference,
        applicantName: data.applicantName,
        clientId: data.clientId,
        serviceType: data.serviceType,
        coordinatorId: data.coordinatorId,
        stage: "DRAFT_INTAKE",
        stageUpdatedAt: new Date()
      }
    });
    revalidatePath("/pipeline");
    return { success: true, case: newCase };
  } catch (error) {
    console.error("Error creating case:", error);
    return { success: false, error: "Failed to create new case" };
  }
}

export async function getCaseDetails(caseId: string) {
  try {
    const caseFile = await prisma.caseFile.findUnique({
      where: { id: caseId },
      include: {
        client: {
          select: { name: true, type: true, visaType: true, phone: true }
        },
        coordinator: {
          select: { name: true }
        },
        documents: {
          orderBy: { title: 'asc' }
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });
    return caseFile;
  } catch (error) {
    console.error("Error fetching case details:", error);
    return null;
  }
}

export async function updateDocumentStatus(docId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  try {
    const doc = await prisma.documentChecklist.update({
      where: { id: docId },
      data: { status }
    });
    revalidatePath("/pipeline");
    return { success: true, document: doc };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Failed to update document status" };
  }
}

export async function addCaseDocument(caseId: string, title: string) {
  try {
    const doc = await prisma.documentChecklist.create({
      data: {
        title,
        caseFileId: caseId,
        status: 'PENDING'
      }
    });
    revalidatePath("/pipeline");
    return { success: true, document: doc };
  } catch (error) {
    console.error("Error adding document:", error);
    return { success: false, error: "Failed to add document" };
  }
}