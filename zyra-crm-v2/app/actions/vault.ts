"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getVaultDocuments() {
  try {
    const documents = await prisma.documentVault.findMany({
      include: {
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
    return documents;
  } catch (error) {
    console.error("Error fetching vault documents:", error);
    return [];
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
    console.error("Error uploading document:", error);
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
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
