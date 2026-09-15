/**
 * Selective wipe: deletes operational records only (clients, cases,
 * documents/line items, transactions/ledger, and their client/case-scoped
 * dependents). Never touches User/Account/Session (admin login) or
 * CompanySettings/ServiceItem/PortalWallet (reference data & settings).
 *
 * Deletion order respects FK constraints:
 *   Document (cascades DocumentItem)   -- Document.clientId has no onDelete, must go before Client
 *   CaseFile (cascades DocumentChecklist, WhatsAppLog[caseId])
 *   Transaction (cascades TransactionPayment)
 *   Client (cascades Employee, DocumentVault, WhatsAppLog[clientId])
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const documents = await tx.document.deleteMany({});
    const caseFiles = await tx.caseFile.deleteMany({});
    const transactions = await tx.transaction.deleteMany({});
    const clients = await tx.client.deleteMany({});
    return { documents, caseFiles, transactions, clients };
  });

  console.log("WIPE_RESULT=" + JSON.stringify({
    documentsDeleted: result.documents.count,
    caseFilesDeleted: result.caseFiles.count,
    transactionsDeleted: result.transactions.count,
    clientsDeleted: result.clients.count,
  }));
}

main()
  .catch((err) => {
    console.error("WIPE FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
