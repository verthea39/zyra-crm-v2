import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const txn = await db.invoice.findUnique({
      where: { id },
      include: { lineItems: true }
    });

    if (!txn) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const receiptUrl = (txn as any).govReceiptUrl || txn.lineItems[0]?.govReceiptUrl;
    if (receiptUrl) {
      return NextResponse.json({ 
        message: 'PDF already generated', 
        url: receiptUrl 
      }, { status: 200 });
    }

    await inngest.send({
      name: 'invoice/generate.pdf',
      data: { invoiceId: id }
    });

    return NextResponse.json({ 
      message: 'Job enqueued successfully' 
    }, { status: 202 });

  } catch (error: any) {
    console.error('Enqueue error:', error);
    return NextResponse.json({ error: 'Failed to enqueue job' }, { status: 500 });
  }
}
