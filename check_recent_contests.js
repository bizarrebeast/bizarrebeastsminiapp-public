const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentContests() {
  console.log('Checking recent contests...\n');

  // Get the 5 most recent contests
  const { data: contests, error } = await supabase
    .from('contests')
    .select('id, name, type, created_at, gallery_enabled, display_votes, gallery_view_type, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching contests:', error);
    return;
  }

  console.log(`Found ${contests.length} recent contests:\n`);

  contests.forEach((contest, index) => {
    console.log(`${index + 1}. ${contest.name}`);
    console.log(`   ID: ${contest.id}`);
    console.log(`   Type: ${contest.type}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   Gallery Enabled: ${contest.gallery_enabled}`);
    console.log(`   Display Votes: ${contest.display_votes}`);
    console.log(`   Gallery View: ${contest.gallery_view_type}`);
    console.log(`   Created: ${new Date(contest.created_at).toLocaleString()}`);
    console.log('');
  });
}

checkRecentContests();