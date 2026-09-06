import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const templates = await db.serviceTemplate.findMany({
    include: { stepDefs: true },
  });

  console.log(JSON.stringify(templates, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
