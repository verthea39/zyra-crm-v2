import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const getCachedClientSummary = async (clientId: string) => {
  const fetchCached = unstable_cache(
    async () => {
      return prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          code: true,
          individualProfile: { select: { fullNameEn: true, email: true } },
          corporateProfile: { select: { companyNameEn: true, contactEmail: true } },
          _count: {
            select: {
              invoices: true,
              quotations: true,
            },
          },
        },
      });
    },
    ['client-summary', clientId], // Dynamic cache key
    {
      revalidate: 3600, // Fallback TTL: 1 hour
      tags: [`client-${clientId}`, 'clients-list'], // Dynamic tags
    }
  );

  return fetchCached();
};
