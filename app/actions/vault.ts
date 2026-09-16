"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logServerError } from "@/lib/logger";

export async function getVaultDocuments() {
  try {
    // Deliberately excludes fileUrl: scanned documents (OCR) can store a
    // multi-hundred-KB base64 data URL there, and this list can render
    // hundreds of rows -- selecting it here would balloon the page payload.
    // The actual file is fetched on demand via getVaultDocumentFile().
    const documents = await prisma.documentVault.findMany({
      select: {
        id: true,
        category: true,
        title: true,
        expiryDate: true,
        remarks: true,
        createdAt: true,
        client: {
          select: { id: true, name: true, phone: true }
        },
        employee: {
          select: { id: true, name: true, corporate: { select: { name: true } } }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });
    // uploadVaultDocument() always writes a fileUrl (real data, or the
    // "/placeholder-doc.pdf" fallback) -- there's no create path that leaves
    // it null, so this is safe without re-selecting the payload just to
    // check presence.
    return documents.map((d) => ({ ...d, hasFile: true }));
  } catch (error) {
    logServerError(error, { action: "getVaultDocuments" });
    return [];
  }
}

/** Fetches just the file payload for one document, on demand (see getVaultDocuments). */
export async function getVaultDocumentFile(id: string) {
  try {
    const doc = await prisma.documentVault.findUnique({ where: { id }, select: { fileUrl: true } });
    return { success: true, fileUrl: doc?.fileUrl || null };
  } catch (error) {
    logServerError(error, { action: "getVaultDocumentFile" });
    return { success: false, fileUrl: null };
  }
}

export async function uploadVaultDocument(data: {
  clientId: string;
  category: string;
  title: string;
  expiryDate: string;
  remarks?: string;
  fileUrl?: string;
}) {
  try {
    const newDoc = await prisma.documentVault.create({
      data: {
        clientId: data.clientId,
        category: data.category,
        title: data.title,
        expiryDate: new Date(data.expiryDate),
        remarks: data.remarks,
        fileUrl: data.fileUrl || "/placeholder-doc.pdf",
      }
    });
    revalidatePath("/vault");
    return { success: true, document: newDoc };
  } catch (error) {
    logServerError(error, { action: "uploadVaultDocument" });
    return { success: false, error: "Failed to upload document" };
  }
}

export async function deleteVaultDocument(id: string) {
  try {
    await prisma.documentVault.delete({
      where: { id }
    });
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    logServerError(error, { action: "deleteVaultDocument" });
    return { success: false, error: "Failed to delete document" };
  }
}
