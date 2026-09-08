const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@agency.ae';
  const password = 'Password123!';

  console.log('Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
       console.log('User already exists in Supabase Auth.');
    } else {
       console.error('Error creating auth user:', authError);
       return;
    }
  }

  const authUserId = authData?.user?.id;
  if (!authUserId) {
    // If already exists, fetch it
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);
    if (!existing) {
       console.error("Could not find user id");
       return;
    }
    var finalAuthId = existing.id;
  } else {
    var finalAuthId = authUserId;
  }

  console.log('Finding SUPER_ADMIN role...');
  const role = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!role) {
    console.error('SUPER_ADMIN role not found. Please run prisma db seed first.');
    return;
  }

  console.log('Creating user in Prisma DB...');
  await prisma.user.upsert({
    where: { email },
    update: { authId: finalAuthId, roleId: role.id },
    create: {
      email,
      name: 'System Admin',
      authId: finalAuthId,
      roleId: role.id,
      isActive: true
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
