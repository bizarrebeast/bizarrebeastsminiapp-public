// Helper to sync vote counts from contest_votes to contest_submissions
import { supabase } from './supabase';

export async function syncVoteCount(submissionId: string) {
  try {
    // Count votes for this submission
    const { count, error: countError } = await supabase
      .from('contest_votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId);

    if (countError) {
      console.error('Error counting votes:', countError);
      return false;
    }

    // Update the submission with the vote count
    const { error: updateError } = await supabase
      .from('contest_submissions')
      .update({ vote_count: count || 0 })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating vote count:', updateError);
      return false;
    }

    console.log(`✅ Synced vote count for submission ${submissionId}: ${count} votes`);
    return true;
  } catch (error) {
    console.error('Vote sync error:', error);
    return false;
  }
}

export async function syncAllVoteCounts(contestId: string) {
  try {
    // Get all submissions for this contest
    const { data: submissions, error: subError } = await supabase
      .from('contest_submissions')
      .select('id')
      .eq('contest_id', contestId);

    if (subError) {
      console.error('Error fetching submissions:', subError);
      return false;
    }

    // Sync each submission
    for (const submission of submissions || []) {
      await syncVoteCount(submission.id);
    }

    console.log(`✅ Synced all vote counts for contest ${contestId}`);
    return true;
  } catch (error) {
    console.error('Sync all error:', error);
    return false;
  }
}