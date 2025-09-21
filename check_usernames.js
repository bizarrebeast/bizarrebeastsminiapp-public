const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsernames() {
  const contestId = 'd8ace9a2-2016-482b-9c41-913e07c3008b';

  try {
    // Check recent submissions
    const { data: submissions, error } = await supabase
      .from('contest_submissions')
      .select('id, wallet_address, username, score, submitted_at, metadata')
      .eq('contest_id', contestId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching submissions:', error);
      return;
    }

    console.log(`\nRecent submissions for contest (showing username field):`);
    console.log('=' .repeat(60));

    submissions.forEach((sub, i) => {
      console.log(`\n${i + 1}. Wallet: ${sub.wallet_address}`);
      console.log(`   Username: ${sub.username || 'NULL'}`);
      console.log(`   Score: ${sub.score}`);
      console.log(`   Submitted: ${new Date(sub.submitted_at).toLocaleString()}`);
      if (sub.metadata?.farcaster_fid) {
        console.log(`   Farcaster FID: ${sub.metadata.farcaster_fid}`);
      }
    });

    // Count how many have usernames
    const withUsernames = submissions.filter(s => s.username).length;
    console.log('\n' + '=' .repeat(60));
    console.log(`Summary: ${withUsernames}/${submissions.length} submissions have usernames`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkUsernames();