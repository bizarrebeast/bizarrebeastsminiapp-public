const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRitual1Issue() {
  console.log('=== Checking Ritual 1 Share Issue ===\n');

  // Get the most recent ritual 1 shares
  const { data: shares, error } = await supabase
    .from('user_shares')
    .select('*, user:unified_users(*)')
    .eq('share_type', 'ritual')
    .eq('content_id', '1')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${shares.length} recent shares for Ritual 1:\n`);

  shares.forEach((share, i) => {
    const age = Math.floor((Date.now() - new Date(share.created_at).getTime()) / (60 * 1000));
    console.log(`Share ${i + 1}:`);
    console.log(`  ID: ${share.id}`);
    console.log(`  Platform: ${share.share_platform}`);
    console.log(`  Created: ${new Date(share.created_at).toLocaleString()}`);
    console.log(`  Age: ${age} minutes ago`);
    console.log(`  Verified: ${share.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`  User ID: ${share.user_id}`);

    if (share.user) {
      console.log(`  User Info:`);
      console.log(`    - Username: ${share.user.username || 'None'}`);
      console.log(`    - Farcaster Username: ${share.user.farcaster_username || 'None'}`);
      console.log(`    - Farcaster FID: ${share.user.farcaster_fid || 'None'}`);
      console.log(`    - Wallet: ${share.user.wallet_address ? 'Connected' : 'Not connected'}`);
    }

    if (share.verified_at) {
      console.log(`  Verified At: ${new Date(share.verified_at).toLocaleString()}`);
    }
    if (share.verification_data) {
      console.log(`  Verification: ${JSON.stringify(share.verification_data)}`);
    }
    console.log('---');
  });

  // Check the most recent share
  if (shares.length > 0) {
    const mostRecent = shares[0];
    const ageMinutes = Math.floor((Date.now() - new Date(mostRecent.created_at).getTime()) / (60 * 1000));

    console.log('\n=== Analysis of Most Recent Share ===');
    console.log(`Age: ${ageMinutes} minutes`);

    if (!mostRecent.verified && ageMinutes > 5) {
      console.log('❌ Share is older than 5 minutes and not verified');
      console.log('This explains why it didn\'t mark as complete');
    } else if (!mostRecent.verified && ageMinutes <= 5) {
      console.log('⚠️  Share is recent but not verified - checking why...');

      // Try to manually verify
      console.log('\nAttempting manual verification...');
      const response = await fetch('http://localhost:3000/api/shares/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareId: mostRecent.id,
          platform: mostRecent.share_platform,
          verificationData: {}
        })
      });

      const result = await response.json();
      console.log('Verification result:', JSON.stringify(result, null, 2));
    } else if (mostRecent.verified) {
      console.log('✅ Share is verified - should be marked as complete');
      console.log('If not showing in UI, might be a frontend state issue');
    }
  }

  // Check if user has FID
  console.log('\n=== Checking Current User FID ===');
  // Get the user who made the most recent share
  if (shares.length > 0 && shares[0].user) {
    const user = shares[0].user;
    if (!user.farcaster_fid) {
      console.log('❌ User does NOT have Farcaster FID stored!');
      console.log('This is why Neynar verification isn\'t working properly');
      console.log('The app should store FID when user connects with Farcaster');
    } else {
      console.log('✅ User has FID:', user.farcaster_fid);
    }
  }
}

checkRitual1Issue().catch(console.error);