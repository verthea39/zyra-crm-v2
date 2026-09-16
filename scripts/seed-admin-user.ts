import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({ select: { id: true } });
  if (existing) {
    console.log("USER_ALREADY_EXISTS=" + existing.id);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@zyrabusinesshub.com",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    select: { id: true, name: true, role: true },
  });

  console.log("USER_CREATED=" + JSON.stringify(user));
}

main()
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
