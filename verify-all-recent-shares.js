const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAllRecentShares() {
  console.log('=== Verifying All Recent Unverified Shares ===\n');

  // Get all unverified ritual shares from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: unverifiedShares, error } = await supabase
    .from('user_shares')
    .select('*')
    .eq('share_type', 'ritual')
    .eq('verified', false)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shares:', error);
    return;
  }

  console.log(`Found ${unverifiedShares.length} unverified ritual shares from today\n`);

  let verifiedCount = 0;
  let failedCount = 0;

  for (const share of unverifiedShares) {
    const age = Math.floor((Date.now() - new Date(share.created_at).getTime()) / (60 * 1000));

    console.log(`Processing share ${share.id}:`);
    console.log(`  Ritual: ${share.content_id}`);
    console.log(`  Platform: ${share.share_platform}`);
    console.log(`  Age: ${Math.abs(age)} minutes`);

    // Call verification endpoint
    try {
      const response = await fetch('http://localhost:3000/api/shares/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareId: share.id,
          platform: share.share_platform,
          verificationData: {}
        })
      });

      const result = await response.json();

      if (result.verified) {
        console.log(`  ✅ Verified! Points: ${result.pointsAwarded || 0}`);
        verifiedCount++;
      } else {
        console.log(`  ❌ Not verified: ${result.message || 'Unknown reason'}`);
        failedCount++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failedCount++;
    }

    console.log('---');
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total processed: ${unverifiedShares.length}`);
  console.log(`Successfully verified: ${verifiedCount}`);
  console.log(`Failed to verify: ${failedCount}`);

  // Now check ritual 1 specifically
  console.log('\n=== Checking Ritual 1 Status ===');
  const { data: ritual1Shares } = await supabase
    .from('user_shares')
    .select('*')
    .eq('share_type', 'ritual')
    .eq('content_id', '1')
    .order('created_at', { ascending: false })
    .limit(1);

  if (ritual1Shares && ritual1Shares.length > 0) {
    const latest = ritual1Shares[0];
    console.log('Latest Ritual 1 share:');
    console.log(`  ID: ${latest.id}`);
    console.log(`  Verified: ${latest.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`  Created: ${new Date(latest.created_at).toLocaleString()}`);
    if (latest.verified) {
      console.log('\n✅ Ritual 1 should now be marked as complete in your UI!');
      console.log('If not showing, try refreshing the page.');
    }
  }
}

verifyAllRecentShares().catch(console.error);