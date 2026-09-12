import { Inngest } from 'inngest';

export type InvoicePdfEvents = {
  'invoice/generate.pdf': {
    data: {
      invoiceId: string;
    };
  };
  'invoice/dispatch.whatsapp': {
    data: {
      invoiceId: string;
    };
  };
};

export const inngest = new Inngest({
  id: 'zyra-crm',
});
