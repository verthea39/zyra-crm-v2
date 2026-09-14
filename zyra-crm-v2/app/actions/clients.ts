"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClient(data: any) {
  try {
    const client = await prisma.client.create({
      data: {
        type: data.type,
        name: data.name,
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
