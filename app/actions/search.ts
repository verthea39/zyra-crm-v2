"use server";

import prisma from "@/lib/prisma";

export type SearchResult = {
  id: string;
  type: "CLIENT" | "CASE" | "DOCUMENT";
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const [clients, cases, documents] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, phone: true, type: true },
        take: 5,
      }),
      prisma.caseFile.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { applicantName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, reference: true, applicantName: true, serviceType: true },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { client: { select: { name: true } } },
        take: 5,
      }),
    ]);

    const results: SearchResult[] = [
      ...clients.map((c) => ({
        id: c.id,
        type: "CLIENT" as const,
        title: c.name,
        subtitle: c.phone || c.type,
        href: `/finance/cockpit`,
      })),
      ...cases.map((c) => ({
        id: c.id,
        type: "CASE" as const,
        title: c.applicantName || c.reference,
        subtitle: `${c.reference} • ${c.serviceType}`,
        href: `/pipeline`,
      })),
      ...documents.map((d) => ({
        id: d.id,
        type: "DOCUMENT" as const,
        title: d.reference,
        subtitle: `${d.type.charAt(0) + d.type.slice(1).toLowerCase()} • ${d.client.name}`,
        href: `/documents/${d.id}`,
      })),
    ];

    return results;
  } catch (error) {
    console.error("Global search failed:", error);
    return [];
  }
}
