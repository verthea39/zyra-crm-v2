"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    return { success: true, client };
  } catch (error) {
    console.error("Error creating client:", error);
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
    console.error("Error updating client:", error);
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
    console.error("Error fetching client:", error);
    return null;
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({ where: { id } });
    revalidatePath("/finance/cockpit");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client. They may have linked cases or transactions." };
  }
}
