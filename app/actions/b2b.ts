"use server";

import prisma from "@/lib/prisma";

export async function getCorporateClients() {
  try {
    const corporates = await prisma.client.findMany({
      where: {
        type: "CORPORATE"
      },
      include: {
        employees: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    return corporates;
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    return [];
  }
}
