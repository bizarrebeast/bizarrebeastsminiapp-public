const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function checkSubmission() {
  const walletAddress = '0xfb70c8b3d0cbd18f5bcaf871831166bbf78cf742';

  try {
    // Get all submissions from this wallet
    const { data: submissions, error } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\nAll submissions from @bulgakov-vlad (${walletAddress}):`);
    console.log('='.repeat(80));

    submissions.forEach((sub, i) => {
      console.log(`\n${i + 1}. Submission ID: ${sub.id}`);
      console.log(`   Username field: ${sub.username || 'NULL'}`);
      console.log(`   Score: ${sub.score}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Submitted at: ${new Date(sub.submitted_at).toLocaleString()}`);
      console.log(`   Metadata:`, JSON.stringify(sub.metadata, null, 2));
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkSubmission();