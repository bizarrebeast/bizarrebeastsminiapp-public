const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRitual5() {
  console.log('=== Verifying Ritual 5 Share ===\n');

  // Get the most recent ritual 5 share
  const { data: shares, error } = await supabase
    .from('user_shares')
    .select('*')
    .eq('share_type', 'ritual')
    .eq('content_id', '5')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${shares.length} recent shares for Ritual 5:\n`);

  shares.forEach((share, i) => {
    const age = Math.floor((Date.now() - new Date(share.created_at).getTime()) / (60 * 1000));
    console.log(`Share ${i + 1}:`);
    console.log(`  ID: ${share.id}`);
    console.log(`  Platform: ${share.share_platform}`);
    console.log(`  Created: ${new Date(share.created_at).toLocaleString()}`);
    console.log(`  Age: ${age} minutes ago`);
    console.log(`  Verified: ${share.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`  Points Awarded: ${share.points_awarded || 0}`);
    if (share.verified_at) {
      console.log(`  Verified At: ${new Date(share.verified_at).toLocaleString()}`);
    }
    if (share.verification_data) {
      console.log(`  Verification: ${JSON.stringify(share.verification_data)}`);
    }
    console.log('---');
  });

  // Check if most recent share was verified
  if (shares.length > 0 && shares[0].verified) {
    console.log('\n✅ SUCCESS: Your ritual 5 share was properly tracked and verified!');
    console.log('The ritual should be marked as complete in your UI.');
  } else if (shares.length > 0) {
    console.log('\n⚠️  Your share was tracked but not verified yet.');
    console.log('This might be because it\'s older than 5 minutes.');
  }
}

verifyRitual5().catch(console.error);