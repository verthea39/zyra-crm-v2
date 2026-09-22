"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logServerError } from "@/lib/logger";
import { CaseStage, CasePriority } from "@prisma/client";
import { z } from "zod";

const advanceCaseStageSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  newStage: z.nativeEnum(CaseStage),
});

const updateCaseDetailsSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  clientId: z.string().min(1, "Sponsor / client is required"),
  coordinatorId: z.string().min(1, "Assigned staff is required"),
  priority: z.nativeEnum(CasePriority),
  notes: z.string().max(2000).optional(),
});

export async function getCases() {
  try {
    const cases = await prisma.caseFile.findMany({
      include: {
        client: {
          select: { name: true, type: true, visaType: true, phone: true }
        },
        coordinator: {
          select: { name: true }
        },
        // For the card's financial snippet (Billed/Paid/Outstanding) -- a
        // case can carry more than one invoice, so these get summed client-side.
        transactions: {
          where: { type: "INCOME" },
          select: { amountTotal: true, amountPaid: true },
        },
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
  const parsed = advanceCaseStageSchema.safeParse({ caseId, newStage });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid stage transition payload" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.caseFile.findUnique({
        where: { id: parsed.data.caseId },
        select: { stage: true, reference: true, client: { select: { name: true } } },
      });
      if (!existing) throw new Error("NOT_FOUND");

      const updatedCase = await tx.caseFile.update({
        where: { id: parsed.data.caseId },
        data: {
          stage: parsed.data.newStage,
          stageUpdatedAt: new Date()
        }
      });

      await tx.activityLog.create({
        data: {
          action: "STATUS_UPDATED",
          title: `Case ${existing.reference} (${existing.client?.name || "Unknown Client"}) moved to ${parsed.data.newStage}`,
          details: { caseId: parsed.data.caseId, previousStage: existing.stage, newStage: parsed.data.newStage },
          entityType: "CASE",
          entityId: parsed.data.caseId,
          actorName: "Admin User",
        },
      });

      return updatedCase;
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, case: result };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { success: false, error: "Case not found." };
    }
    logServerError(error, { action: "advanceCaseStage", extra: { caseId, newStage } });
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? `: ${error.message.split("\n")[0]}` : "";
    return { success: false, error: `Failed to update case stage${detail}` };
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

export async function updateCaseDetails(input: {
  caseId: string;
  applicantName: string;
  clientId: string;
  coordinatorId: string;
  priority: CasePriority;
  notes?: string;
}) {
  const parsed = updateCaseDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid case details payload" };
  }

  try {
    const updated = await prisma.caseFile.update({
      where: { id: parsed.data.caseId },
      data: {
        applicantName: parsed.data.applicantName,
        clientId: parsed.data.clientId,
        coordinatorId: parsed.data.coordinatorId,
        priority: parsed.data.priority,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true, case: updated };
  } catch (error) {
    logServerError(error, { action: "updateCaseDetails", extra: { caseId: input.caseId } });
    return { success: false, error: "Failed to update case details" };
  }
}

/**
 * DocumentChecklist and WhatsAppLog already cascade at the schema level, and
 * Document/Transaction relations SetNull rather than blocking -- so a hard
 * delete here is already FK-safe. The only guard needed is a business-rule
 * one: don't silently delete a case that already has billed
 * invoices/quotations attached, since that would orphan real financial
 * records without any confirmation of what's being lost.
 */
export async function deleteCase(caseId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.caseFile.findUnique({
        where: { id: caseId },
        select: { reference: true, billingDocuments: { select: { id: true } } },
      });
      if (!existing) throw new Error("NOT_FOUND");
      if (existing.billingDocuments.length > 0) throw new Error("HAS_DOCUMENTS");

      await tx.caseFile.delete({ where: { id: caseId } });
      return existing.reference;
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true, reference: result };
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return { success: false, error: "Case not found." };
    }
    if (error?.message === "HAS_DOCUMENTS") {
      return { success: false, error: "Cannot delete -- this case has quotations/invoices attached. Cancel or reassign them first." };
    }
    logServerError(error, { action: "deleteCase", extra: { caseId } });
    return { success: false, error: "Failed to delete case" };
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