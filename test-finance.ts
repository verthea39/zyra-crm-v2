const { createTransaction } = require('./lib/services/finance.service');
const { db } = require('./lib/db');

async function test() {
  try {
    const category = await db.category.findFirst({ where: { direction: "INCOME" } });
    const client = await db.client.findFirst();
    const account = await db.account.findFirst();

    console.log("Found Category:", category?.id);
    console.log("Found Client:", client?.id);

    const data = {
      direction: "INCOME",
      amountAed: 1500,
      occurredAt: new Date(),
      categoryId: category.id,
      clientId: client.id,
      description: "Test income from script"
    };

    const result = await createTransaction(data, "test-user");
    console.log("Transaction created:", result);

  } catch (error) {
    console.error("Error creating transaction:", error);
  } finally {
    await db.$disconnect();
  }
}

test();
