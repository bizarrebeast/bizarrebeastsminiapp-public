const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRitualTracking() {
  console.log('=== Debugging Ritual Tracking Issues ===\n');

  // 1. Check recent shares
  console.log('1. Recent shares in database:');
  const { data: recentShares, error: sharesError } = await supabase
    .from('user_shares')
    .select('id, share_type, content_id, share_platform, verified, created_at, user_id')
    .eq('share_type', 'ritual')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sharesError) {
    console.error('Error fetching shares:', sharesError);
  } else {
    console.log('Found', recentShares.length, 'recent ritual shares:');
    recentShares.forEach(share => {
      console.log(`  - Ritual ${share.content_id}: ${share.share_platform}, Verified: ${share.verified}, Created: ${new Date(share.created_at).toLocaleString()}`);
    });
  }

  console.log('\n2. Checking for user issues:');
  // Get unique user IDs from recent shares
  const userIds = [...new Set(recentShares?.map(s => s.user_id) || [])];

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('id, username, farcaster_username, farcaster_fid, wallet_address')
      .in('id', userIds);

    if (users) {
      console.log('Users who shared:');
      users.forEach(user => {
        console.log(`  - ${user.username || user.farcaster_username || 'Unknown'} (FID: ${user.farcaster_fid || 'None'}, Wallet: ${user.wallet_address ? 'Yes' : 'No'})`);
      });
    }
  }

  console.log('\n3. Checking share cooldowns:');
  // Check if cooldown function is working
  if (userIds.length > 0) {
    const testUserId = userIds[0];
    const { data: canShare1, error: cooldownError1 } = await supabase
      .rpc('check_share_cooldown', {
        p_user_id: testUserId,
        p_share_type: 'ritual',
        p_content_id: '1',
        p_cooldown_minutes: 60
      });

    const { data: canShare2 } = await supabase
      .rpc('check_share_cooldown', {
        p_user_id: testUserId,
        p_share_type: 'ritual',
        p_content_id: '2',
        p_cooldown_minutes: 60
      });

    console.log(`  User ${testUserId} can share ritual 1: ${canShare1}`);
    console.log(`  User ${testUserId} can share ritual 2: ${canShare2}`);
  }

  console.log('\n4. Testing verification for specific rituals:');
  // Check last share for each ritual
  const ritualIds = [1, 2, 6];
  for (const ritualId of ritualIds) {
    const { data: lastShare } = await supabase
      .from('user_shares')
      .select('*')
      .eq('share_type', 'ritual')
      .eq('content_id', ritualId.toString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastShare) {
      console.log(`  Ritual ${ritualId}:`);
      console.log(`    Last shared: ${new Date(lastShare.created_at).toLocaleString()}`);
      console.log(`    Platform: ${lastShare.share_platform}`);
      console.log(`    Verified: ${lastShare.verified}`);
      console.log(`    User ID: ${lastShare.user_id}`);
    } else {
      console.log(`  Ritual ${ritualId}: No shares found`);
    }
  }

  console.log('\n=== End Debug ===');
}

debugRitualTracking().catch(console.error);