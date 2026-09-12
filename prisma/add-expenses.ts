import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const rel = (days: number) => new Date(now + days * DAY);

async function main() {
  console.log("Adding sample expenses...");
  
  // Create some users first if we need a createdById, or we can leave it null
  const admin = await db.user.findFirst({ where: { role: { name: "SUPER_ADMIN" } } });
  const adminId = admin?.id;

  const expenses = [
    {
      reference: `EXP-${new Date().getFullYear()}-0001`,
      vendorName: "Dubai Properties",
      description: "Office Rent - Q3",
      amountMinor: 2500000n, // 25,000.00
      taxMinor: 125000n,    // 1,250.00
      totalMinor: 2625000n, // 26,250.00
      paidMinor: 2625000n,
      balanceDueMinor: 0n,
      status: "PAID",
      occurredAt: rel(-15),
      createdById: adminId,
    },
    {
      reference: `EXP-${new Date().getFullYear()}-0002`,
      vendorName: "Amer Center",
      description: "Typing and Processing Fees",
      amountMinor: 85000n,  // 850.00
      taxMinor: 4250n,      // 42.50
      totalMinor: 89250n,   // 892.50
      paidMinor: 89250n,
      balanceDueMinor: 0n,
      status: "PAID",
      occurredAt: rel(-5),
      createdById: adminId,
    },
    {
      reference: `EXP-${new Date().getFullYear()}-0003`,
      vendorName: "Du Telecom",
      description: "Office Internet & Phones",
      amountMinor: 120000n, // 1,200.00
      taxMinor: 6000n,      // 60.00
      totalMinor: 126000n,  // 1,260.00
      paidMinor: 0n,
      balanceDueMinor: 126000n,
      status: "UNPAID",
      occurredAt: rel(-1),
      createdById: adminId,
    },
    {
      reference: `EXP-${new Date().getFullYear()}-0004`,
      vendorName: "DED",
      description: "Trade License Renewal Fee",
      amountMinor: 1500000n, // 15,000.00
      taxMinor: 0n,
      totalMinor: 1500000n,
      paidMinor: 0n,
      balanceDueMinor: 1500000n,
      status: "UNPAID",
      occurredAt: rel(0),
      createdById: adminId,
    }
  ];

  for (const exp of expenses) {
    await db.expense.upsert({
      where: { reference: exp.reference },
      update: {},
      create: exp,
    });
  }

  console.log("Successfully added expenses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
