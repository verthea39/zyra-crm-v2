import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function wipe() {
  console.log("Wiping database...");
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.fieldTaskCheckIn.deleteMany(),
    db.task.deleteMany(),
    db.workflowStep.deleteMany(),
    db.workflow.deleteMany(),
    db.payment.deleteMany(),
    db.quotationLineItem.deleteMany(),
    db.quotation.deleteMany(),
    db.document.deleteMany(),
    db.individualProfile.deleteMany(),
    db.corporateProfile.deleteMany(),
    db.client.deleteMany(),
    db.serviceStepDef.deleteMany(),
    db.serviceTemplate.deleteMany(),
    db.user.deleteMany(),
  ]);
  console.log("Wipe complete!");
}

wipe()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
