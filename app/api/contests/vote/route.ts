import { NextRequest, NextResponse } from 'next/server';
import { contestQueries } from '@/lib/supabase';
import { syncVoteCount } from '@/lib/vote-sync';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contestId, submissionId, walletAddress, action } = body;

    // Validate required fields
    if (!contestId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get contest details to check voting status
    const contest = await contestQueries.getContest(contestId);
    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Check if voting is enabled
    if (!contest.voting_enabled) {
      return NextResponse.json(
        { error: 'Voting is not enabled for this contest' },
        { status: 400 }
      );
    }

    // Check voting period
    const now = new Date();
    if (contest.voting_start_date && new Date(contest.voting_start_date) > now) {
      return NextResponse.json(
        { error: 'Voting has not started yet' },
        { status: 400 }
      );
    }

    if (contest.voting_end_date && new Date(contest.voting_end_date) < now) {
      return NextResponse.json(
        { error: 'Voting has ended' },
        { status: 400 }
      );
    }

    if (action === 'remove') {
      // Get the vote before removing to sync the count (using admin client to bypass RLS)
      const { data: existingVote } = await supabaseAdmin
        .from('contest_votes')
        .select('*')
        .eq('contest_id', contestId)
        .eq('voter_address', walletAddress.toLowerCase())
        .single();

      // Remove existing vote (using admin client to bypass RLS)
      const { error: deleteError } = await supabaseAdmin
        .from('contest_votes')
        .delete()
        .eq('contest_id', contestId)
        .eq('voter_address', walletAddress.toLowerCase());

      if (deleteError) {
        console.error('Error removing vote:', deleteError);
        throw deleteError;
      }

      // Sync the vote count for the affected submission
      if (existingVote) {
        await syncVoteCount(existingVote.submission_id);
      }

      return NextResponse.json({
        success: true,
        message: 'Vote removed successfully'
      });
    } else {
      // Cast or change vote
      if (!submissionId) {
        return NextResponse.json(
          { error: 'Submission ID required for voting' },
          { status: 400 }
        );
      }

      // Check if submission exists and is approved (using admin client to bypass RLS)
      const { data: submissions } = await supabaseAdmin
        .from('contest_submissions')
        .select('*')
        .eq('contest_id', contestId)
        .eq('status', 'approved');

      const submission = submissions?.find(s => s.id === submissionId);

      if (!submission) {
        return NextResponse.json(
          { error: 'Invalid or non-approved submission' },
          { status: 400 }
        );
      }

      // Check if user already voted (using admin client to bypass RLS)
      const { data: existingVote } = await supabaseAdmin
        .from('contest_votes')
        .select('*')
        .eq('contest_id', contestId)
        .eq('voter_address', walletAddress.toLowerCase())
        .single();

      if (existingVote) {
        // Remove old vote first (using admin client to bypass RLS)
        const { error: deleteError } = await supabaseAdmin
          .from('contest_votes')
          .delete()
          .eq('contest_id', contestId)
          .eq('voter_address', walletAddress.toLowerCase());

        if (deleteError) {
          console.error('Error removing old vote:', deleteError);
          throw deleteError;
        }
      }

      // Cast new vote (using admin client to bypass RLS)
      const { data: vote, error: voteError } = await supabaseAdmin
        .from('contest_votes')
        .insert({
          contest_id: contestId,
          submission_id: submissionId,
          voter_address: walletAddress.toLowerCase()
        })
        .select()
        .single();

      if (voteError) {
        console.error('Error casting vote:', voteError);
        throw voteError;
      }

      // Sync the vote count to the submission
      await syncVoteCount(submissionId);

      // If changing vote, also sync the old submission
      if (existingVote && existingVote.submission_id !== submissionId) {
        await syncVoteCount(existingVote.submission_id);
      }

      return NextResponse.json({
        success: true,
        vote,
        message: existingVote ? 'Vote changed successfully' : 'Vote cast successfully'
      });
    }
  } catch (error) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const walletAddress = searchParams.get('walletAddress');

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID required' },
        { status: 400 }
      );
    }

    if (walletAddress) {
      // Get user's vote (using admin client to bypass RLS)
      const { data: vote } = await supabaseAdmin
        .from('contest_votes')
        .select('*')
        .eq('contest_id', contestId)
        .eq('voter_address', walletAddress.toLowerCase())
        .single();

      return NextResponse.json({ vote: vote || null });
    } else {
      // Get all voting results
      const results = await contestQueries.getVotingResults(contestId);
      return NextResponse.json({ results });
    }
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}