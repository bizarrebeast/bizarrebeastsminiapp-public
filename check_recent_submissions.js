const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function checkRecentSubmissions() {
  try {
    const { data: submissions, error } = await supabase
      .from('contest_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\nMost recent contest submissions:');
    console.log('='.repeat(80));

    let index = 0;
    for (const sub of submissions) {
      index++;
      console.log('\n' + index + '. Wallet: ' + sub.wallet_address);
      console.log('   Username: ' + (sub.username || 'NULL'));
      console.log('   Score: ' + sub.score);
      console.log('   Submitted: ' + new Date(sub.submitted_at).toLocaleString());
      if (sub.metadata) {
        console.log('   Metadata FID: ' + (sub.metadata.farcaster_fid || 'NULL'));
        console.log('   User Agent: ' + (sub.metadata.user_agent || 'NULL'));
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkRecentSubmissions();
