import { convertToInvoice } from './lib/actions/quotations';
import { db } from './lib/db';

async function test() {
  const quotation = await db.quotation.findFirst({
    where: { status: 'DRAFT' }
  });
  
  if (!quotation) {
    console.log("No draft quotation found");
    return;
  }
  
  try {
    const res = await convertToInvoice(quotation.id);
    console.log("Success:", res);
  } catch (err) {
    console.error("Action error:", err);
  }
}

test().finally(() => process.exit(0));
