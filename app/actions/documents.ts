"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateDocumentTotals, lineTotalMinor, DEFAULT_VAT_RATE } from "@/lib/calculations";
import type { DocumentType } from "@prisma/client";

export type DocumentItemInput = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  vatExempt?: boolean;
};

export type CreateDocumentInput = {
  type: DocumentType;
  clientId: string;
  caseFileId?: string;
  items: DocumentItemInput[];
  discountMinor?: number;
  vatRate?: number;
  dueDate?: string;
  expiryDate?: string;
  notes?: string;
};

export type UpdateDocumentInput = Omit<CreateDocumentInput, "type">;

const TYPE_PREFIX: Record<DocumentType, string> = {
  INVOICE: "INV",
  QUOTATION: "QT",
  RECEIPT: "RCT",
};

async function generateReference(type: DocumentType) {
  const year = new Date().getFullYear();
  const count = await prisma.document.count({ where: { type } });
  const seq = (count + 1).toString().padStart(3, "0");
  return `${TYPE_PREFIX[type]}-${year}-${seq}`;
}

export async function createDocument(input: CreateDocumentInput) {
  try {
    const items = input.items.filter((i) => i.description.trim());
    if (items.length === 0) {
      return { success: false, error: "At least one line item is required" };
    }

    const totals = calculateDocumentTotals(items, {
      discountMinor: input.discountMinor,
      vatRate: input.vatRate,
    });

    const reference = await generateReference(input.type);

    const doc = await prisma.document.create({
      data: {
        reference,
        type: input.type,
        clientId: input.clientId,
        caseFileId: input.caseFileId || undefined,
        subtotalMinor: totals.subtotalMinor,
        discountMinor: totals.discountMinor,
        vatRate: input.vatRate ?? DEFAULT_VAT_RATE,
        vatMinor: totals.vatMinor,
        totalMinor: totals.totalMinor,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        notes: input.notes,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            lineTotalMinor: lineTotalMinor(item),
            vatExempt: item.vatExempt ?? false,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/documents");
    revalidatePath("/");
    return { success: true, document: doc };
  } catch (err) {
    console.error("Failed to create document:", err);
    return { success: false, error: "Failed to create document" };
  }
}

export async function updateDocument(id: string, input: UpdateDocumentInput) {
  try {
    const items = input.items.filter((i) => i.description.trim());
    if (items.length === 0) {
      return { success: false, error: "At least one line item is required" };
    }

    const totals = calculateDocumentTotals(items, {
      discountMinor: input.discountMinor,
      vatRate: input.vatRate,
    });

    const doc = await prisma.$transaction(async (tx) => {
      await tx.documentItem.deleteMany({ where: { documentId: id } });
      return tx.document.update({
        where: { id },
        data: {
          clientId: input.clientId,
          caseFileId: input.caseFileId || undefined,
          subtotalMinor: totals.subtotalMinor,
          discountMinor: totals.discountMinor,
          vatRate: input.vatRate ?? DEFAULT_VAT_RATE,
          vatMinor: totals.vatMinor,
          totalMinor: totals.totalMinor,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          notes: input.notes,
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceMinor: item.unitPriceMinor,
              lineTotalMinor: lineTotalMinor(item),
              vatExempt: item.vatExempt ?? false,
            })),
          },
        },
        include: { items: true },
      });
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${id}`);
    return { success: true, document: doc };
  } catch (err) {
    console.error("Failed to update document:", err);
    return { success: false, error: "Failed to update document" };
  }
}

export async function getDocuments(type?: DocumentType) {
  try {
    return await prisma.document.findMany({
      where: type ? { type } : undefined,
      include: { client: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    return [];
  }
}

export async function getDocument(id: string) {
  try {
    return await prisma.document.findUnique({
      where: { id },
      include: { client: true, items: true, caseFile: true },
    });
  } catch (err) {
    console.error("Failed to fetch document:", err);
    return null;
  }
}

export async function updateDocumentStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") {
  try {
    await prisma.document.update({ where: { id }, data: { status } });
    revalidatePath("/documents");
    return { success: true };
  } catch (err) {
    console.error("Failed to update document status:", err);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteDocument(id: string) {
  try {
    await prisma.document.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete document:", err);
    return { success: false, error: "Failed to delete document" };
  }
}
