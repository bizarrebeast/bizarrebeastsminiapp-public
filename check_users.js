require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check users with your wallet
  const { data: walletUsers, error: walletError } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('wallet_address', '%3FDD6aFEd7a19990632468c7102219d051E685dB%');

  console.log('Users with wallet 0x3FDD...:', walletUsers);
  if (walletError) console.error('Wallet error:', walletError);

  // Check @bizarrebeast user
  const { data: bbUsers, error: bbError } = await supabase
    .from('unified_users')
    .select('*')
    .eq('farcaster_username', 'bizarrebeast');

  console.log('\nUsers with username bizarrebeast:', bbUsers);
  if (bbError) console.error('Username error:', bbError);

  // Check users with display name Testuser
  const { data: testUsers, error: testError } = await supabase
    .from('unified_users')
    .select('*')
    .eq('farcaster_display_name', 'Testuser');

  console.log('\nUsers with display_name Testuser:', testUsers);
  if (testError) console.error('Test error:', testError);
})();