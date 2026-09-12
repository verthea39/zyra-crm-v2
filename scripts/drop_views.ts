import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS receivables_ageing CASCADE');
  console.log('View dropped');
}
main().catch(console.error).finally(() => prisma.$disconnect());
