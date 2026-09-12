const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.expense.findMany().then(e => console.log('Expenses count:', e.length)).catch(console.error).finally(() => prisma.$disconnect());
