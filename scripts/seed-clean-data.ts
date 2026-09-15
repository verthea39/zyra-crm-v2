/**
 * One-off structured import: seeds Clients, Invoices (+ their Receipts),
 * and Expenses from a fixed dataset into the live Prisma database.
 *
 * Mapping notes (this schema has no separate Invoice/Expense/Payment
 * models -- everything financial is one `Transaction` table with
 * type INCOME/EXPENSE, plus `TransactionPayment` rows for partial/full
 * receipts against an income Transaction):
 *   - "Client" rows      -> Client
 *   - "Income" rows      -> Transaction(type: INCOME), linked to the
 *                           matching Client by name; paidAmountAED > 0
 *                           also creates a TransactionPayment (the receipt)
 *   - "Expense" rows     -> Transaction(type: EXPENSE)
 *   - TRN and EID-expiry are not columns on Client in this schema (Client
 *     only has tradeLicenseNo/expiryDate for corporates and
 *     passportNo/passportExpiry for individuals) -- they are intentionally
 *     dropped rather than shoehorned into an unrelated field.
 *
 * Deliberately NOT wrapped in one big prisma.$transaction: with this
 * pooler's connection_limit=1, a single long-running interactive
 * transaction holding the one connection for ~57 sequential round trips
 * over a higher-latency connection reliably exceeds Prisma's interactive
 * transaction timeout (P2028). Each write is its own statement instead;
 * the upsert-by-lookup pattern makes the whole script safely re-runnable
 * if it's interrupted partway through.
 *
 * Run with: npx tsx scripts/seed-clean-data.ts
 */
import { PrismaClient, ClientType, TransactionType } from "@prisma/client";
import { computeTransactionStatus } from "../lib/calculations";
import { logActivity } from "../lib/activity";

const prisma = new PrismaClient();

type RawRow = {
  transactionId: string;
  type: "Client" | "Income" | "Expense";
  category?: string;
  counterparty: string;
  date: string;
  amountAED: number;
  paymentStatus?: string;
  dueDate?: string;
  clientType?: string;
  leadSource?: string;
  place?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  emiratesId?: string;
  eidExpiry?: string;
  nationality?: string;
  visaType?: string;
  tradeLicenseNo?: string;
  trn?: string;
  licenseExpiry?: string;
  paidAmountAED?: number;
  balanceAED?: number;
  paymentMode?: string;
  remarks?: string;
};

const DATA: RawRow[] = require("./seed-clean-data.json");

async function seedClients() {
  const clientIdByName = new Map<string, string>();
  let created = 0;

  for (const row of DATA.filter((r) => r.type === "Client")) {
    const isCorporate = (row.clientType || "").toLowerCase().includes("corporate");

    const existing = await prisma.client.findFirst({
      where: { name: row.counterparty, phone: row.phone || undefined },
    });

    const data = {
      type: isCorporate ? ClientType.CORPORATE : ClientType.INDIVIDUAL,
      name: row.counterparty,
      phone: row.phone,
      leadSource: row.leadSource,
      place: row.place,
      nationality: row.nationality,
      visaType: row.visaType,
      passportNo: isCorporate ? undefined : row.passportNumber,
      passportExpiry: !isCorporate && row.passportExpiry ? new Date(row.passportExpiry) : undefined,
      emiratesIdNo: isCorporate ? undefined : row.emiratesId,
      tradeLicenseNo: isCorporate ? row.tradeLicenseNo : undefined,
      expiryDate: isCorporate && row.licenseExpiry ? new Date(row.licenseExpiry) : undefined,
    };

    const client = existing
      ? await prisma.client.update({ where: { id: existing.id }, data })
      : await prisma.client.create({ data });

    if (!existing) created++;
    clientIdByName.set(row.counterparty, client.id);
  }

  return { clientIdByName, created };
}

async function seedInvoices(clientIdByName: Map<string, string>) {
  let invoicesCreated = 0;
  let receiptsCreated = 0;

  for (const row of DATA.filter((r) => r.type === "Income")) {
    const amountTotal = Math.round(row.amountAED * 100);
    const amountPaid = Math.round((row.paidAmountAED || 0) * 100);
    const dueDate = row.dueDate ? new Date(row.dueDate) : null;
    const status = computeTransactionStatus(amountTotal, amountPaid, dueDate);
    const clientId = clientIdByName.get(row.counterparty);

    const existing = await prisma.transaction.findUnique({ where: { reference: row.transactionId } });
    const txData = {
      reference: row.transactionId,
      type: TransactionType.INCOME,
      counterparty: row.counterparty,
      category: row.category || "Visa & Immigration Services",
      paymentMode: row.paymentMode,
      amountTotal,
      amountPaid,
      status,
      date: new Date(row.date),
      dueDate,
      clientId: clientId || undefined,
    };

    const transaction = existing
      ? await prisma.transaction.update({ where: { id: existing.id }, data: txData })
      : await prisma.transaction.create({ data: txData });

    if (!existing) invoicesCreated++;

    if (amountPaid > 0) {
      const existingPayment = await prisma.transactionPayment.findFirst({
        where: { transactionId: transaction.id, transactionRef: row.transactionId },
      });
      if (!existingPayment) {
        await prisma.transactionPayment.create({
          data: {
            transactionId: transaction.id,
            amountMinor: amountPaid,
            method: row.paymentMode || "Card",
            transactionRef: row.transactionId,
            paidAt: new Date(row.date),
          },
        });
        receiptsCreated++;
      }
    }
  }

  return { invoicesCreated, receiptsCreated };
}

async function seedExpenses() {
  let expensesCreated = 0;

  for (const row of DATA.filter((r) => r.type === "Expense")) {
    const amountTotal = Math.round(row.amountAED * 100);
    const amountPaid = Math.round((row.paidAmountAED || 0) * 100);
    const dueDate = row.dueDate ? new Date(row.dueDate) : null;
    const status = computeTransactionStatus(amountTotal, amountPaid, dueDate);

    const existing = await prisma.transaction.findUnique({ where: { reference: row.transactionId } });
    const txData = {
      reference: row.transactionId,
      type: TransactionType.EXPENSE,
      counterparty: row.counterparty,
      category: row.category || "General",
      paymentMode: row.paymentMode,
      amountTotal,
      amountPaid,
      status,
      date: new Date(row.date),
      dueDate,
      description: row.remarks,
    };

    if (existing) {
      await prisma.transaction.update({ where: { id: existing.id }, data: txData });
    } else {
      await prisma.transaction.create({ data: txData });
      expensesCreated++;
    }
  }

  return { expensesCreated };
}

async function main() {
  const { clientIdByName, created: clientsCreated } = await seedClients();
  const { invoicesCreated, receiptsCreated } = await seedInvoices(clientIdByName);
  const { expensesCreated } = await seedExpenses();

  console.log(
    "SEED_RESULT=" + JSON.stringify({ clientsCreated, invoicesCreated, receiptsCreated, expensesCreated })
  );

  await logActivity({
    action: "CLIENT_ADDED",
    title: `Bulk import: ${clientsCreated} clients added from seed dataset`,
    details: { count: clientsCreated },
    entityType: "CLIENT",
  });
  await logActivity({
    action: "INVOICE_ISSUED",
    title: `Bulk import: ${invoicesCreated} invoices (${receiptsCreated} with receipts) added from seed dataset`,
    details: { invoicesCreated, receiptsCreated },
    entityType: "INVOICE",
  });
  await logActivity({
    action: "EXPENSE_RECORDED",
    title: `Bulk import: ${expensesCreated} expenses added from seed dataset`,
    details: { count: expensesCreated },
    entityType: "EXPENSE",
  });

  const counts = {
    clients: await prisma.client.count(),
    incomeTransactions: await prisma.transaction.count({ where: { type: "INCOME" } }),
    expenseTransactions: await prisma.transaction.count({ where: { type: "EXPENSE" } }),
    payments: await prisma.transactionPayment.count(),
  };
  console.log("FINAL_COUNTS=" + JSON.stringify(counts));
}

main()
  .catch((err) => {
    console.error("SEED FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
