import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting finance migration...");
  
  // 1. Ensure core accounts exist
  const accountsToCreate = [
    { code: '1000', name: 'Bank — Current', type: 'ASSET', isBank: true },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1200', name: 'Undeposited Funds', type: 'ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '2100', name: 'VAT Payable', type: 'LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
    { code: '4000', name: 'Sales / Service Revenue', type: 'INCOME' },
    { code: '4100', name: 'Gov Fee Reimbursements', type: 'INCOME' },
    { code: '5000', name: 'Gov Fees Expense', type: 'EXPENSE' },
    { code: '5100', name: 'Bank Fees', type: 'EXPENSE' },
    { code: '5200', name: 'General Expenses', type: 'EXPENSE' },
  ];

  for (const acc of accountsToCreate) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, type: acc.type as any, isBank: acc.isBank || false },
      create: { code: acc.code, name: acc.name, type: acc.type as any, isBank: acc.isBank || false }
    });
  }
  
  const bankAcc = await prisma.account.findUnique({ where: { code: '1000' }});
  const arAcc = await prisma.account.findUnique({ where: { code: '1100' }});
  const salesAcc = await prisma.account.findUnique({ where: { code: '4000' }});
  const expenseAcc = await prisma.account.findUnique({ where: { code: '5200' }});

  if (!bankAcc || !arAcc || !salesAcc || !expenseAcc) throw new Error("Core accounts missing");

  // Migrate old accounts that have no code
  const oldAccounts: any[] = await prisma.$queryRaw`SELECT * FROM "Account" WHERE "code" IS NULL`;
  let codeCounter = 9000;
  for (const oldAcc of oldAccounts) {
    await prisma.account.update({
      where: { id: oldAcc.id },
      data: { code: String(codeCounter++), type: 'ASSET' } // Safe fallback
    });
  }

  // Migrate Transactions -> JournalEntry
  const transactions: any[] = await prisma.$queryRaw`SELECT * FROM "Transaction"`;
  console.log(`Migrating ${transactions.length} transactions...`);

  for (const txn of transactions) {
    const isIncome = txn.direction === 'INCOME';
    
    // Create Journal Entry
    const je = await prisma.journalEntry.create({
      data: {
        entryDate: txn.occurredAt,
        sourceType: isIncome ? 'INVOICE' : 'EXPENSE',
        sourceId: txn.id,
        memo: txn.description || txn.reference,
        createdAt: txn.createdAt
      }
    });

    if (isIncome) {
      // Debit AR
      await prisma.journalLine.create({
        data: {
          journalEntryId: je.id,
          accountId: arAcc.id,
          debitMinor: txn.amountFils,
          clientId: txn.clientId
        }
      });
      // Credit Sales
      await prisma.journalLine.create({
        data: {
          journalEntryId: je.id,
          accountId: salesAcc.id,
          creditMinor: txn.amountFils,
          clientId: txn.clientId
        }
      });
    } else {
      // Expense: Debit Expense
      await prisma.journalLine.create({
        data: {
          journalEntryId: je.id,
          accountId: expenseAcc.id,
          debitMinor: txn.amountFils,
          clientId: txn.clientId
        }
      });
      // Credit Bank (since old system single-entry assumed paid expenses)
      await prisma.journalLine.create({
        data: {
          journalEntryId: je.id,
          accountId: bankAcc.id,
          creditMinor: txn.amountFils,
          clientId: txn.clientId
        }
      });
    }
  }

  // Migrate Payments
  const payments = await prisma.payment.findMany();
  console.log(`Migrating ${payments.length} payments...`);
  // Note: payment fields are now amountMinor and unappliedMinor directly in the schema
  // so no update is necessary if they are just renamed in schema.

  // Migrate PaymentAllocations
  const allocations: any[] = await prisma.$queryRaw`SELECT * FROM "PaymentAllocation"`;
  console.log(`Migrating ${allocations.length} payment allocations...`);
  for (const pa of allocations) {
    const txn: any[] = await prisma.$queryRaw`SELECT * FROM "Transaction" WHERE id = ${pa.transactionId}`;
    const transaction = txn[0];
    const inv = transaction ? await prisma.invoice.findFirst({ where: { invoiceNumber: transaction.reference }}) : null;
    
    if (inv) {
      await prisma.paymentAllocation.update({
        where: { id: pa.id },
        data: {
          invoiceId: inv.id,
          amountMinor: pa.amountFils || 0n
        }
      });
    } else if (transaction && transaction.clientId) {
      const dummyInv = await prisma.invoice.upsert({
        where: { invoiceNumber: "MIG-" + transaction.reference },
        update: {},
        create: {
          clientId: transaction.clientId,
          invoiceNumber: "MIG-" + transaction.reference,
          subtotalServiceFeesMinor: pa.amountFils || 0n,
          vatAmountMinor: 0n,
          subtotalGovDisbursementsMinor: 0n,
          totalPayableMinor: pa.amountFils || 0n,
          balanceDueMinor: 0n,
          status: "PAID",
          supplierTrn: "N/A"
        }
      });
      await prisma.paymentAllocation.update({
        where: { id: pa.id },
        data: {
          invoiceId: dummyInv.id,
          amountMinor: pa.amountFils || 0n
        }
      });
    } else {
       // Just delete un-migratable allocations to avoid constraint failure
       await prisma.paymentAllocation.delete({ where: { id: pa.id } });
    }
  }
  
  console.log("Migration complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
