const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function test() {
  const quotation = await db.quotation.findFirst({
    include: { lineItems: true }
  });
  
  if (!quotation) {
    console.log("No quotation found");
    return;
  }
  
  const quotationId = quotation.id;
  
  const invoice = await db.invoice.create({
    data: {
      clientId: quotation.clientId,
      invoiceNumber: "TEST-INV-1",
      supplierTrn: "100000000000003",
      subtotalServiceFees: 100,
      vatAmount: 5,
      subtotalGovDisbursements: 100,
      totalPayable: 205,
      balanceDue: 205,
      status: "DRAFT",
      quotation: { connect: { id: quotationId } }, // Associate quotation
      lineItems: {
        create: quotation.lineItems.map((item) => ({
          description: item.description,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.type === "AGENCY_SERVICE_FEE" ? 5 : 0,
          lineTotal: 100,
          govReceiptRef: item.govReceiptRef || null,
        })),
      },
    },
  });
  console.log("Invoice created", invoice);
}

test().catch(console.error).finally(() => db.$disconnect());
