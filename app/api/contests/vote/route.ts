import { NextRequest, NextResponse } from 'next/server';
import { contestQueries } from '@/lib/supabase';

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
      // Remove existing vote
      await contestQueries.removeVote(contestId, walletAddress);

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

      // Check if submission exists and is approved
      const submissions = await contestQueries.getContestSubmissions(contestId, 'approved');
      const submission = submissions.find(s => s.id === submissionId);

      if (!submission) {
        return NextResponse.json(
          { error: 'Invalid or non-approved submission' },
          { status: 400 }
        );
      }

      // Check if user already voted (to handle vote changes)
      const existingVote = await contestQueries.getUserVote(contestId, walletAddress);

      if (existingVote) {
        // Remove old vote first
        await contestQueries.removeVote(contestId, walletAddress);
      }

      // Cast new vote
      const vote = await contestQueries.castVote(contestId, submissionId, walletAddress);

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
      // Get user's vote
      const vote = await contestQueries.getUserVote(contestId, walletAddress);
      return NextResponse.json({ vote });
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