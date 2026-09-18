"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { logServerError } from "@/lib/logger";

export async function createClient(data: any) {
  try {
    const client = await prisma.client.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        leadSource: data.leadSource,
        place: data.place,
        phone: data.phone,
        nationality: data.nationality,
        visaType: data.visaType,
        passportNo: data.passportNo,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
        emiratesIdNo: data.emiratesIdNo,
        // Corporate fields
        tradeLicenseNo: data.tradeLicenseNo,
        expiryDate: data.tradeLicenseExpiry ? new Date(data.tradeLicenseExpiry) : null,
      },
    });

    revalidatePath("/finance/cockpit");

    await logActivity({
      action: "CLIENT_ADDED",
      title: `Client "${client.name}" added`,
      details: { clientId: client.id, type: client.type },
      entityType: "CLIENT",
      entityId: client.id,
    });

    return { success: true, client };
  } catch (error) {
    logServerError(error, { action: "createClient" });
    return { success: false, error: "Failed to create client profile." };
  }
}

export async function updateClient(id: string, data: any) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        leadSource: data.leadSource,
        place: data.place,
        phone: data.phone,
        nationality: data.nationality,
        visaType: data.visaType,
        passportNo: data.passportNo,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
        emiratesIdNo: data.emiratesIdNo,
        tradeLicenseNo: data.tradeLicenseNo,
        expiryDate: data.tradeLicenseExpiry ? new Date(data.tradeLicenseExpiry) : null,
      },
    });

    revalidatePath("/finance/cockpit");
    return { success: true, client };
  } catch (error) {
    logServerError(error, { action: "updateClient" });
    return { success: false, error: "Failed to update client profile." };
  }
}

export async function getClient(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: { transactions: { orderBy: { date: "desc" } } },
    });
  } catch (error) {
    logServerError(error, { action: "getClient" });
    return null;
  }
}

/** Full profile fetch for the /clients/[id] page -- billing, cases, and vault docs in one round trip. */
export async function getClientProfile(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { type: "INCOME" },
          include: { payments: { orderBy: { paidAt: "desc" } } },
          orderBy: { date: "desc" },
        },
        cases: {
          include: { coordinator: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        vaultDocuments: {
          orderBy: { expiryDate: "asc" },
        },
      },
    });
  } catch (error) {
    logServerError(error, { action: "getClientProfile" });
    return null;
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({ where: { id } });
    revalidatePath("/finance/cockpit");
    return { success: true };
  } catch (error) {
    logServerError(error, { action: "deleteClient" });
    return { success: false, error: "Failed to delete client. They may have linked cases or transactions." };
  }
}
