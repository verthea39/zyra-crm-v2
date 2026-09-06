import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const adminEmail = "admin@agency.ae";
  const defaultPassword = "Admin123!_Zyra2026"; // Strong default password

  console.log(`Checking for user ${adminEmail} in Prisma...`);
  const prismaUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!prismaUser) {
    console.error(`User ${adminEmail} not found in Prisma DB.`);
    return;
  }

  console.log(`Checking if user already exists in Supabase Auth...`);
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing Supabase users:", listError);
    return;
  }

  let supabaseUser = users.users.find(u => u.email === adminEmail);

  if (!supabaseUser) {
    console.log(`Creating user ${adminEmail} in Supabase Auth...`);
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: defaultPassword,
      email_confirm: true,
    });

    if (createError || !createdUser.user) {
      console.error("Error creating user in Supabase:", createError);
      return;
    }
    
    supabaseUser = createdUser.user;
    console.log(`User created successfully with ID: ${supabaseUser.id}`);
    console.log(`Temporary Password: ${defaultPassword}`);
  } else {
    console.log(`User already exists in Supabase with ID: ${supabaseUser.id}`);
    // Optional: Reset password to the default for smooth transition
    await supabase.auth.admin.updateUserById(supabaseUser.id, { password: defaultPassword });
    console.log(`Password reset to temporary default: ${defaultPassword}`);
  }

  console.log(`Linking Supabase ID to Prisma User...`);
  await prisma.user.update({
    where: { email: adminEmail },
    data: { authId: supabaseUser.id },
  });

  console.log("Migration complete! You can now log in using Supabase Auth.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
