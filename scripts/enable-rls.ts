import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all tables in the public schema...");
  
  const result = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public';
  `;

  const tables = result as { tablename: string }[];
  
  for (const table of tables) {
    if (table.tablename === '_prisma_migrations') continue;
    
    console.log(`Enabling RLS on ${table.tablename}...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${table.tablename}" ENABLE ROW LEVEL SECURITY;`);
  }
  
  console.log("Successfully enabled RLS on all public tables!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
