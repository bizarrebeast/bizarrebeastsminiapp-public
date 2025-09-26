// Investigation endpoint for specific user submission issues
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // The wallet fragment we know
  const walletFragment = searchParams.get('wallet') || '0xfb70';
  const contestId = '0a9b438b-c841-4a88-b5e8-b3868fb52ee4';

  try {
    // Find all wallets that match the fragment
    const { data: allSubmissions, error: searchError } = await supabase
      .from('contest_submissions')
      .select('*')
      .or(`wallet_address.ilike.${walletFragment}%,wallet_address.ilike.%${walletFragment.slice(2)}`)
      .order('submitted_at', { ascending: false });

    if (searchError) throw searchError;

    // Group by wallet to find the specific user
    const walletGroups: { [key: string]: any[] } = {};
    allSubmissions?.forEach(sub => {
      if (!walletGroups[sub.wallet_address]) {
        walletGroups[sub.wallet_address] = [];
      }
      walletGroups[sub.wallet_address].push(sub);
    });

    // Find submissions for the specific contest
    const contestSubmissions = allSubmissions?.filter(s => s.contest_id === contestId) || [];

    // Check for votes on these submissions
    const submissionIds = contestSubmissions.map(s => s.id);
    const { data: votes, error: voteError } = await supabase
      .from('contest_votes')
      .select('*')
      .in('submission_id', submissionIds);

    if (voteError) console.error('Vote fetch error:', voteError);

    // Check the vote counts in the submissions themselves
    const { data: submissionsWithVotes } = await supabase
      .from('contest_submissions')
      .select('id, vote_count, wallet_address, username, contest_id')
      .eq('contest_id', contestId)
      .in('id', submissionIds);

    // Look for username @bulgakov-vlad
    const { data: usernameSubmissions } = await supabase
      .from('contest_submissions')
      .select('*')
      .or('username.ilike.%bulgakov%,username.ilike.%vlad%')
      .order('submitted_at', { ascending: false });

    const report = {
      investigation_target: '@bulgakov-vlad',
      wallet_fragment: walletFragment,
      contest_id: contestId,

      matching_wallets: Object.keys(walletGroups).map(wallet => ({
        wallet,
        total_submissions: walletGroups[wallet].length,
        contests_entered: [...new Set(walletGroups[wallet].map(s => s.contest_id))].length,
        submissions_in_target_contest: walletGroups[wallet].filter(s => s.contest_id === contestId).length,
        all_submissions: walletGroups[wallet].map(s => ({
          id: s.id,
          contest_id: s.contest_id,
          submitted_at: s.submitted_at,
          username: s.username
        }))
      })),

      contest_specific: {
        total_submissions_in_contest: contestSubmissions.length,
        submissions: contestSubmissions.map(s => ({
          id: s.id,
          wallet: s.wallet_address,
          username: s.username,
          submitted_at: s.submitted_at,
          vote_count_field: s.vote_count,
          status: s.status
        }))
      },

      voting_data: {
        total_votes_found: votes?.length || 0,
        votes: votes?.map(v => ({
          submission_id: v.submission_id,
          voter: v.voter_address,
          created_at: v.created_at
        })),
        submission_vote_counts: submissionsWithVotes
      },

      username_search: {
        found_by_username: usernameSubmissions?.length || 0,
        submissions: usernameSubmissions?.map(s => ({
          wallet: s.wallet_address,
          contest_id: s.contest_id,
          username: s.username,
          submitted_at: s.submitted_at
        }))
      },

      // Check for case sensitivity issues
      case_sensitivity_check: {
        lowercase_search: walletFragment.toLowerCase(),
        uppercase_search: walletFragment.toUpperCase(),
        mixed_case: walletFragment
      }
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Investigation error:', error);
    return NextResponse.json(
      { error: 'Investigation failed', details: error },
      { status: 500 }
    );
  }
}