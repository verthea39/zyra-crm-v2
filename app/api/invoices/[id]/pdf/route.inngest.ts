import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, govReceiptUrl: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Return existing PDF URL immediately if already generated
  if (invoice.govReceiptUrl) {
    return NextResponse.json({
      status: 'COMPLETED',
      url: invoice.govReceiptUrl,
    });
  }

  // Send event to Inngest
  await inngest.send({
    name: 'invoice/generate.pdf',
    data: { invoiceId },
  });

  return NextResponse.json(
    { status: 'QUEUED', message: 'PDF creation started' },
    { status: 202 }
  );
}

// Polling endpoint for the front-end to check readiness
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, govReceiptUrl: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json({
    completed: Boolean(invoice.govReceiptUrl),
    url: invoice.govReceiptUrl ?? null,
  });
}
