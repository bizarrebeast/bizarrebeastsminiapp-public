const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDraftContests() {
  console.log('Checking contest statuses...\n');

  // Get all contests
  const { data: contests, error } = await supabase
    .from('contests')
    .select('id, name, status, is_test')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching contests:', error);
    return;
  }

  console.log('Found contests:');
  contests.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name}`);
    console.log(`   Status: ${c.status} | Test: ${c.is_test}`);
  });

  // Find test contests with "(Copy)" in name that aren't draft
  const testsToFix = contests.filter(c =>
    c.is_test &&
    c.name.includes('(Copy)') &&
    c.status !== 'draft'
  );

  if (testsToFix.length > 0) {
    console.log(`\n\nFound ${testsToFix.length} test contests to update to draft status:`);

    for (const contest of testsToFix) {
      console.log(`\nUpdating: ${contest.name}`);
      console.log(`  Current status: ${contest.status} → draft`);

      const { error: updateError } = await supabase
        .from('contests')
        .update({ status: 'draft' })
        .eq('id', contest.id);

      if (updateError) {
        console.error(`  ❌ Error:`, updateError.message);
      } else {
        console.log(`  ✅ Updated successfully!`);
      }
    }
  } else {
    console.log('\n✅ No contests need status updates.');
  }
}

fixDraftContests();