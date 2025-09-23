const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserFids() {
  console.log('=== Checking User Farcaster FIDs ===\n');

  // Get all users with recent shares
  const { data: shares } = await supabase
    .from('user_shares')
    .select('user_id')
    .eq('share_type', 'ritual')
    .order('created_at', { ascending: false })
    .limit(20);

  const uniqueUserIds = [...new Set(shares?.map(s => s.user_id) || [])];

  console.log('Checking', uniqueUserIds.length, 'users who shared rituals:\n');

  for (const userId of uniqueUserIds) {
    const { data: user } = await supabase
      .from('unified_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (user) {
      console.log(`User: ${user.id}`);
      console.log(`  Username: ${user.username || 'None'}`);
      console.log(`  Farcaster Username: ${user.farcaster_username || 'None'}`);
      console.log(`  Farcaster FID: ${user.farcaster_fid || 'None'}`);
      console.log(`  Wallet Address: ${user.wallet_address ? 'Yes' : 'No'}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('---');
    }
  }

  // Check if there are any users with FIDs at all
  const { data: usersWithFids, error } = await supabase
    .from('unified_users')
    .select('id, farcaster_username, farcaster_fid')
    .not('farcaster_fid', 'is', null);

  console.log('\nUsers with Farcaster FIDs in database:');
  if (usersWithFids && usersWithFids.length > 0) {
    usersWithFids.forEach(u => {
      console.log(`  - @${u.farcaster_username} (FID: ${u.farcaster_fid})`);
    });
  } else {
    console.log('  None found! This is why verification is failing.');
  }
}

checkUserFids().catch(console.error);