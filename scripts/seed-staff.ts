import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding roles and staff users...");

  // Create roles if they don't exist
  const rolesToCreate = [
    { name: "PRO_AGENT", description: "Field PRO Agent" },
    { name: "OPERATIONS_MANAGER", description: "Operations Manager" },
    { name: "SUPER_ADMIN", description: "Super Administrator" },
  ];

  for (const r of rolesToCreate) {
    await db.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  // Fetch the roles
  const proAgentRole = await db.role.findUnique({ where: { name: "PRO_AGENT" } });
  const opsManagerRole = await db.role.findUnique({ where: { name: "OPERATIONS_MANAGER" } });

  if (!proAgentRole || !opsManagerRole) {
    throw new Error("Roles were not created correctly.");
  }

  // Create some staff members
  const staffToCreate = [
    {
      name: "Ahmed Ali",
      email: "ahmed.pro@zyracrm.local",
      roleId: proAgentRole.id,
      phone: "+971 50 123 4567",
    },
    {
      name: "Sarah Smith",
      email: "sarah.ops@zyracrm.local",
      roleId: opsManagerRole.id,
      phone: "+971 50 765 4321",
    },
    {
      name: "Tariq Mahmood",
      email: "tariq.pro@zyracrm.local",
      roleId: proAgentRole.id,
      phone: "+971 55 999 8888",
    }
  ];

  for (const s of staffToCreate) {
    await db.user.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
  }

  console.log("Staff seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
