const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmAllRitualsVerification() {
  console.log('=== Confirming Verification Status for All Rituals ===\n');

  // Check each ritual (1-9)
  const ritualIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const verificationStatus = {};

  for (const ritualId of ritualIds) {
    // Get the most recent share for this ritual
    const { data: shares, error } = await supabase
      .from('user_shares')
      .select('*')
      .eq('share_type', 'ritual')
      .eq('content_id', ritualId.toString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (shares && shares.length > 0) {
      const share = shares[0];
      const age = Math.floor((Date.now() - new Date(share.created_at).getTime()) / (60 * 1000));

      verificationStatus[ritualId] = {
        hasShare: true,
        verified: share.verified,
        shareId: share.id,
        platform: share.share_platform,
        age: Math.abs(age),
        createdAt: new Date(share.created_at).toLocaleString(),
        pointsAwarded: share.points_awarded || 0
      };
    } else {
      verificationStatus[ritualId] = {
        hasShare: false,
        verified: false
      };
    }
  }

  // Display results
  console.log('Ritual Verification Status:');
  console.log('============================\n');

  for (const ritualId of ritualIds) {
    const status = verificationStatus[ritualId];

    if (status.hasShare) {
      const icon = status.verified ? '✅' : '❌';
      console.log(`Ritual ${ritualId}: ${icon} ${status.verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      console.log(`  Last share: ${status.createdAt}`);
      console.log(`  Platform: ${status.platform}`);
      console.log(`  Age: ${status.age} minutes ago`);
      if (status.verified) {
        console.log(`  Points: ${status.pointsAwarded}`);
      }
    } else {
      console.log(`Ritual ${ritualId}: ⚪ NO SHARES YET`);
    }
    console.log('');
  }

  // Summary
  const verifiedCount = Object.values(verificationStatus).filter(s => s.verified).length;
  const sharedCount = Object.values(verificationStatus).filter(s => s.hasShare).length;

  console.log('============================');
  console.log('Summary:');
  console.log(`  Total rituals with shares: ${sharedCount}/9`);
  console.log(`  Verified rituals: ${verifiedCount}/${sharedCount}`);

  // Check for any unverified shares that should be verified
  const unverifiedRecent = Object.entries(verificationStatus)
    .filter(([id, status]) => status.hasShare && !status.verified && status.age < 10)
    .map(([id]) => id);

  if (unverifiedRecent.length > 0) {
    console.log(`\n⚠️  Found ${unverifiedRecent.length} recent unverified shares (Rituals: ${unverifiedRecent.join(', ')})`);
    console.log('These should be auto-verified. Running verification...\n');

    // Try to verify them
    for (const ritualId of unverifiedRecent) {
      const status = verificationStatus[ritualId];
      console.log(`Verifying Ritual ${ritualId} (Share ID: ${status.shareId})...`);

      try {
        const response = await fetch('http://localhost:3000/api/shares/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shareId: status.shareId,
            platform: status.platform,
            verificationData: {}
          })
        });

        const result = await response.json();
        if (result.verified) {
          console.log(`  ✅ Now verified! Points: ${result.pointsAwarded}`);
        } else {
          console.log(`  ❌ Could not verify: ${result.message}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  } else {
    console.log('\n✅ All shared rituals are properly verified!');
  }

  // Check which rituals you've shared
  console.log('\n============================');
  console.log('Your Ritual Completion Status:');
  const completedRituals = Object.entries(verificationStatus)
    .filter(([id, status]) => status.verified)
    .map(([id]) => `Ritual ${id}`);

  if (completedRituals.length > 0) {
    console.log(`✅ Completed: ${completedRituals.join(', ')}`);
  } else {
    console.log('No rituals completed yet');
  }
}

confirmAllRitualsVerification().catch(console.error);