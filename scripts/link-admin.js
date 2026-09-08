const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'admin@agency.ae';
  
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  const authUser = users.users.find(u => u.email === email);
  if (!authUser) {
    console.log('User not found in Auth. Please run create-admin again.');
    return;
  }
  
  console.log(`Auth ID for ${email} is ${authUser.id}`);
  
  // Update the User table directly via Supabase!
  const { data, error } = await supabase
    .from('User')
    .update({ authId: authUser.id })
    .eq('email', email)
    .select();
    
  if (error) {
    console.error('Error updating Prisma User table via Supabase JS:', error);
  } else {
    console.log('Successfully linked Auth ID to Prisma User table:', data);
  }
}

main().catch(console.error);
