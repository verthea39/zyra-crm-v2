'use server';

import { prisma } from '@/lib/prisma';
import { invalidateDashboardMetricsCache } from '@/lib/api/dashboard-metrics';
import { revalidatePath } from 'next/cache';

export async function markInvoiceAsPaid(invoiceId: string) {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' },
  });

  // Purge Upstash Redis cache so dashboard re-aggregates accurately
  await invalidateDashboardMetricsCache();

  // Revalidate Next.js UI path
  revalidatePath('/dashboard');
}
