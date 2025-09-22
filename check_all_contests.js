const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllContests() {
  console.log('Fetching ALL contests from database...\n');

  // Get ALL contests without any filters
  const { data: contests, error } = await supabase
    .from('contests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contests:', error);
    return;
  }

  console.log(`Total contests in database: ${contests.length}\n`);

  // Group by status
  const byStatus = {};
  contests.forEach(c => {
    if (!byStatus[c.status]) byStatus[c.status] = [];
    byStatus[c.status].push(c);
  });

  console.log('Contests by status:');
  Object.keys(byStatus).forEach(status => {
    console.log(`  ${status}: ${byStatus[status].length} contests`);
  });

  console.log('\nAll contests:');
  contests.forEach((contest, index) => {
    console.log(`\n${index + 1}. ${contest.name}`);
    console.log(`   ID: ${contest.id}`);
    console.log(`   Status: ${contest.status}`);
    console.log(`   Type: ${contest.type}`);
    console.log(`   Is Test: ${contest.is_test}`);
    console.log(`   Created: ${new Date(contest.created_at).toLocaleString()}`);
  });
}

checkAllContests();