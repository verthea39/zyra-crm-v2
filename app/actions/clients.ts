'use server';

import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function updateClientEmail(clientId: string, newEmail: string) {
  await prisma.individualProfile.updateMany({
    where: { clientId },
    data: { email: newEmail },
  });

  // Instantly invalidates all cached views using this tag across Vercel's Edge
  revalidateTag(`client-${clientId}`);
}
