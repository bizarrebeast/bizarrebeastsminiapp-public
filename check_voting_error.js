const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVoting() {
  const contestId = '044072ee-f96c-47a7-a21a-984d52d1e0f8';
  const walletAddress = '0x4F2EcDA8C10EC8Fbe711f6664970826998B81c3E';

  console.log('Testing voting functionality...\n');

  // 1. Check if contest exists and has voting enabled
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, voting_enabled, voting_start_date, voting_end_date')
    .eq('id', contestId)
    .single();

  if (contestError) {
    console.error('Error fetching contest:', contestError);
    return;
  }

  console.log('Contest found:', contest);
  console.log('Voting enabled:', contest.voting_enabled);
  console.log('');

  // 2. Check submissions for this contest
  const { data: submissions, error: subError } = await supabase
    .from('contest_submissions')
    .select('id, wallet_address, status')
    .eq('contest_id', contestId)
    .eq('status', 'approved');

  if (subError) {
    console.error('Error fetching submissions:', subError);
  } else {
    console.log(`Found ${submissions.length} approved submissions`);
    if (submissions.length > 0) {
      console.log('Sample submission:', submissions[0]);
    }
  }
  console.log('');

  // 3. Check if user already has a vote
  const { data: existingVote, error: voteCheckError } = await supabase
    .from('contest_votes')
    .select('*')
    .eq('contest_id', contestId)
    .eq('voter_address', walletAddress.toLowerCase())
    .single();

  if (voteCheckError && voteCheckError.code !== 'PGRST116') {
    console.error('Error checking existing vote:', voteCheckError);
  } else if (existingVote) {
    console.log('User already voted:', existingVote);
  } else {
    console.log('User has not voted yet');
  }
  console.log('');

  // 4. Try to cast a test vote
  if (submissions && submissions.length > 0) {
    const targetSubmission = submissions[0];
    console.log(`Attempting to cast vote for submission ${targetSubmission.id}...`);

    const { data: vote, error: voteError } = await supabase
      .from('contest_votes')
      .insert({
        contest_id: contestId,
        submission_id: targetSubmission.id,
        voter_address: walletAddress.toLowerCase()
      })
      .select()
      .single();

    if (voteError) {
      console.error('❌ Vote failed:', voteError);
      console.log('\nPossible issues:');
      console.log('- RLS policy blocking insert');
      console.log('- Unique constraint violation (already voted)');
      console.log('- Foreign key constraint (submission not found)');
    } else {
      console.log('✅ Vote cast successfully:', vote);

      // Clean up test vote
      await supabase
        .from('contest_votes')
        .delete()
        .eq('id', vote.id);
      console.log('Test vote cleaned up');
    }
  }
}

testVoting();