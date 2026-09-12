import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { generateInvoicePdf } from '@/lib/inngest/functions';
import { dispatchInvoiceWhatsApp, complianceReminders } from '@/lib/inngest/whatsappFunctions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateInvoicePdf,
    dispatchInvoiceWhatsApp,
    complianceReminders
  ],
});
