import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
});

async function main() {
  await db.$transaction([
    db.paymentAllocation.deleteMany(),
    db.payment.deleteMany(),
    db.journalLine.deleteMany(),
    db.journalEntry.deleteMany(),
    db.invoiceLineItem.deleteMany(),
    db.invoice.deleteMany(),
    db.account.deleteMany(),
    db.product.deleteMany(),
    db.caseFile.deleteMany(),

    db.auditLog.deleteMany(),
    db.fieldTaskCheckIn.deleteMany(),
    db.task.deleteMany(),
    db.workflowStep.deleteMany(),
    db.workflow.deleteMany(),
    db.quotationLineItem.deleteMany(),
    db.quotation.deleteMany(),
    db.document.deleteMany(),
    db.individualProfile.deleteMany(),
    db.corporateProfile.deleteMany(),
    db.client.deleteMany(),
  ]);

  // Keep templates and standard users. Just wipe @demo.crm test users if they exist.
  await db.user.deleteMany({ where: { email: { contains: "@demo.crm" } } });
  
  console.log("Database wiped of all dummy data successfully.");
}

main().catch(console.error).finally(() => db.$disconnect());
