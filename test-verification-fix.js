const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVerificationFix() {
  console.log('=== Testing Verification Fix ===\n');

  // Get a recent unverified ritual share
  const { data: unverifiedShare } = await supabase
    .from('user_shares')
    .select('*, user:unified_users(*)')
    .eq('share_type', 'ritual')
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!unverifiedShare) {
    console.log('No unverified shares found to test');
    return;
  }

  console.log('Testing with share:');
  console.log(`  ID: ${unverifiedShare.id}`);
  console.log(`  Ritual: ${unverifiedShare.content_id}`);
  console.log(`  Platform: ${unverifiedShare.share_platform}`);
  console.log(`  User FID: ${unverifiedShare.user?.farcaster_fid || 'None'}`);
  console.log(`  Created: ${new Date(unverifiedShare.created_at).toLocaleString()}`);

  const shareAge = Date.now() - new Date(unverifiedShare.created_at).getTime();
  const ageMinutes = Math.floor(shareAge / (60 * 1000));
  console.log(`  Age: ${ageMinutes} minutes`);

  // Call the verify endpoint
  console.log('\nCalling verify endpoint...');
  const response = await fetch('http://localhost:3000/api/shares/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shareId: unverifiedShare.id,
      platform: unverifiedShare.share_platform,
      verificationData: {}
    })
  });

  const result = await response.json();
  console.log('\nVerification result:');
  console.log(JSON.stringify(result, null, 2));

  // Check if share was updated
  const { data: updatedShare } = await supabase
    .from('user_shares')
    .select('verified, verified_at, points_awarded')
    .eq('id', unverifiedShare.id)
    .single();

  console.log('\nShare after verification:');
  console.log(`  Verified: ${updatedShare.verified}`);
  console.log(`  Verified At: ${updatedShare.verified_at}`);
  console.log(`  Points Awarded: ${updatedShare.points_awarded || 0}`);
}

testVerificationFix().catch(console.error);