require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check all users with Farcaster IDs
  const { data: farcasterUsers, error } = await supabase
    .from('unified_users')
    .select('*')
    .not('farcaster_fid', 'is', null)
    .order('created_at', { ascending: false });

  console.log('All Farcaster users:');
  if (farcasterUsers) {
    farcasterUsers.forEach(user => {
      console.log(`FID: ${user.farcaster_fid}, Username: ${user.farcaster_username}, Display: ${user.farcaster_display_name}, Wallet: ${user.wallet_address}`);
    });
  }

  // Check users with display name containing "Test"
  const { data: testUsers } = await supabase
    .from('unified_users')
    .select('*')
    .or('farcaster_display_name.ilike.%test%,farcaster_username.ilike.%test%');

  console.log('\nUsers with "test" in name:');
  if (testUsers) {
    testUsers.forEach(user => {
      console.log(`FID: ${user.farcaster_fid}, Username: ${user.farcaster_username}, Display: ${user.farcaster_display_name}`);
    });
  }
})();