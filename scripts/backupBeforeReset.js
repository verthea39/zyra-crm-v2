/**
 * One-off backup script: dumps every table that scripts/wipeOperationalData.js
 * is about to delete, to a timestamped local JSON file, before any deletion
 * runs. Read-only -- makes no changes to the database.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const [
    clients,
    caseFiles,
    documents,
    documentItems,
    documentChecklists,
    transactions,
    transactionPayments,
    whatsAppLogs,
    employees,
    documentVaults,
  ] = await Promise.all([
    prisma.client.findMany(),
    prisma.caseFile.findMany(),
    prisma.document.findMany(),
    prisma.documentItem.findMany(),
    prisma.documentChecklist.findMany(),
    prisma.transaction.findMany(),
    prisma.transactionPayment.findMany(),
    prisma.whatsAppLog.findMany(),
    prisma.employee.findMany(),
    prisma.documentVault.findMany(),
  ]);

  const backup = {
    createdAt: new Date().toISOString(),
    counts: {
      clients: clients.length,
      caseFiles: caseFiles.length,
      documents: documents.length,
      documentItems: documentItems.length,
      documentChecklists: documentChecklists.length,
      transactions: transactions.length,
      transactionPayments: transactionPayments.length,
      whatsAppLogs: whatsAppLogs.length,
      employees: employees.length,
      documentVaults: documentVaults.length,
    },
    data: {
      clients,
      caseFiles,
      documents,
      documentItems,
      documentChecklists,
      transactions,
      transactionPayments,
      whatsAppLogs,
      employees,
      documentVaults,
    },
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `backup_before_reset_${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backup, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2));

  const stats = fs.statSync(outPath);
  console.log("BACKUP_PATH=" + outPath);
  console.log("BACKUP_SIZE_BYTES=" + stats.size);
  console.log("COUNTS=" + JSON.stringify(backup.counts));
}

main()
  .catch((err) => {
    console.error("BACKUP FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
