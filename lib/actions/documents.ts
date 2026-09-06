"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
type DocumentCategory = "TRADE_LICENSE" | "ESTABLISHMENT_CARD" | "PASSPORT" | "EMIRATES_ID" | "VISA" | "LABOUR_CARD" | "TENANCY_CONTRACT" | "MEMORANDUM" | "NOC" | "OTHER";
type DocumentVerificationStatus = "PENDING_REVIEW" | "VERIFIED_VALID" | "EXPIRED" | "REJECTED";

const uploadSchema = z.object({
  clientId: z.string().min(1),
  category: z.string(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  expiryDate: z.string().optional(),
});

/**
 * Records a document. `fileUrl` is expected to already point at storage
 * (S3 / Supabase Storage / Firebase) — wire your upload widget's returned
 * URL into this field. This action only persists the metadata row.
 */
export async function createDocument(formData: FormData) {
  await requirePermission("documents:upload");
  const parsed = uploadSchema.parse(Object.fromEntries(formData.entries()));

  await db.document.create({
    data: {
      clientId: parsed.clientId,
      category: parsed.category,
      fileName: parsed.fileName,
      fileUrl: parsed.fileUrl,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      verificationStatus: "PENDING_REVIEW",
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/clients/${parsed.clientId}`);
  redirect("/documents");
}

export async function setDocumentVerification(
  documentId: string,
  status: DocumentVerificationStatus
) {
  await requirePermission("documents:verify");
  await db.document.update({ where: { id: documentId }, data: { verificationStatus: status } });
  revalidatePath("/documents");
}

export async function listDocuments(params: { category?: DocumentCategory } = {}) {
  await requirePermission("documents:read");
  return db.document.findMany({
    where: { category: params.category },
    include: {
      client: { include: { corporateProfile: true, individualProfile: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
}

export async function listClientsForPicker() {
  await requirePermission("clients:read");
  return db.client.findMany({
    include: { corporateProfile: true, individualProfile: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
