import { PrismaClient } from "@prisma/client";
import { logActivity } from "../lib/activity";

const prisma = new PrismaClient();

const WALLETS = [
  { entityName: "Amer / GDRFA", portalType: "IMMIGRATION" },
  { entityName: "DED / Dubai Economy", portalType: "ECONOMIC" },
  { entityName: "ICP Smart Services", portalType: "IMMIGRATION" },
  { entityName: "MOHRE", portalType: "LABOUR" },
];

async function main() {
  let created = 0;
  for (const w of WALLETS) {
    const existing = await prisma.portalWallet.findUnique({ where: { entityName: w.entityName } });
    if (existing) continue;
    await prisma.portalWallet.create({
      data: {
        entityName: w.entityName,
        portalType: w.portalType,
        balance: 0,
        lowBalanceThreshold: 500,
      },
    });
    created++;
  }

  console.log("WALLETS_CREATED=" + created);

  if (created > 0) {
    await logActivity({
      action: "WALLET_INITIALIZED",
      title: `Portal wallets initialized: ${created} government portal wallets added at AED 0.00`,
      entityType: "WALLET",
    });
  }

  const total = await prisma.portalWallet.count();
  console.log("TOTAL_WALLETS=" + total);
}

main()
  .catch((err) => {
    console.error("SEED FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
