"use server";

import prisma from "@/lib/prisma";
import { logServerError } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { calculateDocumentTotals, lineTotalMinor, DEFAULT_VAT_RATE } from "@/lib/calculations";
import type { DocumentType } from "@prisma/client";
import { logActivity } from "@/lib/activity";

const ACTION_BY_TYPE: Record<DocumentType, string> = {
  INVOICE: "INVOICE_ISSUED",
  QUOTATION: "QUOTATION_CREATED",
  RECEIPT: "RECEIPT_CREATED",
};

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
      include: { items: true, client: true },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");

    await logActivity({
      action: ACTION_BY_TYPE[input.type],
      title: `${input.type.charAt(0) + input.type.slice(1).toLowerCase()} #${doc.reference} created for ${doc.client.name}`,
      details: { documentId: doc.id, totalMinor: doc.totalMinor, clientId: doc.clientId },
      entityType: input.type,
      entityId: doc.id,
    });

    return { success: true, document: doc };
  } catch (err) {
    logServerError(err, { action: "createDocument" });
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
        include: { items: true, client: true },
      });
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${id}`);

    await logActivity({
      action: `${doc.type}_UPDATED`,
      title: `${doc.type.charAt(0) + doc.type.slice(1).toLowerCase()} #${doc.reference} updated for ${doc.client.name}`,
      details: { documentId: doc.id, totalMinor: doc.totalMinor },
      entityType: doc.type,
      entityId: doc.id,
    });

    return { success: true, document: doc };
  } catch (err) {
    logServerError(err, { action: "updateDocument" });
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
    logServerError(err, { action: "getDocuments" });
    return [];
  }
}

export async function getDocument(id: string) {
  try {
    return await prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
        caseFile: true,
        convertedInvoice: { select: { id: true, reference: true } },
      },
    });
  } catch (err) {
    logServerError(err, { action: "getDocument" });
    return null;
  }
}

export async function updateDocumentStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") {
  try {
    const existing = await prisma.document.findUnique({ where: { id }, select: { status: true, type: true, reference: true } });
    await prisma.document.update({ where: { id }, data: { status } });
    revalidatePath("/documents");

    if (existing) {
      await logActivity({
        action: "STATUS_UPDATED",
        title: `${existing.type.charAt(0) + existing.type.slice(1).toLowerCase()} #${existing.reference} status changed to ${status}`,
        details: { documentId: id, previousStatus: existing.status, newStatus: status },
        entityType: existing.type,
        entityId: id,
      });
    }

    return { success: true };
  } catch (err) {
    logServerError(err, { action: "updateDocumentStatus" });
    return { success: false, error: "Failed to update status" };
  }
}

export async function convertQuotationToInvoice(quotationId: string) {
  try {
    const quotation = await prisma.document.findUnique({
      where: { id: quotationId },
      include: { items: true, client: true },
    });

    if (!quotation) {
      return { success: false, error: "Quotation not found" };
    }
    if (quotation.type !== "QUOTATION") {
      return { success: false, error: "Only quotations can be converted to invoices" };
    }
    if (quotation.convertedInvoiceId) {
      return { success: false, error: "This quotation has already been converted" };
    }

    const reference = await generateReference("INVOICE");

    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.document.create({
        data: {
          reference,
          type: "INVOICE",
          clientId: quotation.clientId,
          caseFileId: quotation.caseFileId || undefined,
          subtotalMinor: quotation.subtotalMinor,
          discountMinor: quotation.discountMinor,
          vatRate: quotation.vatRate,
          vatMinor: quotation.vatMinor,
          totalMinor: quotation.totalMinor,
          notes: quotation.notes,
          items: {
            create: quotation.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceMinor: item.unitPriceMinor,
              lineTotalMinor: item.lineTotalMinor,
              vatExempt: item.vatExempt,
            })),
          },
        },
        include: { items: true, client: true },
      });

      await tx.document.update({
        where: { id: quotationId },
        data: { status: "CONVERTED", convertedInvoiceId: newInvoice.id },
      });

      return newInvoice;
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${quotationId}`);
    revalidatePath(`/documents/${invoice.id}`);
    revalidatePath("/dashboard");

    await logActivity({
      action: "QUOTATION_CONVERTED",
      title: `Quotation #${quotation.reference} converted to Invoice #${invoice.reference}`,
      details: { quotationId: quotation.id, invoiceId: invoice.id, totalAmount: invoice.totalMinor },
      entityType: "INVOICE",
      entityId: invoice.id,
    });

    return { success: true, invoice };
  } catch (err) {
    logServerError(err, { action: "convertQuotationToInvoice" });
    return { success: false, error: "Failed to convert quotation to invoice" };
  }
}

export async function deleteDocument(id: string) {
  try {
    await prisma.document.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (err) {
    logServerError(err, { action: "deleteDocument" });
    return { success: false, error: "Failed to delete document" };
  }
}
