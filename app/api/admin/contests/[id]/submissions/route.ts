import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const contestId = params.id;

    // Get query params
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    // Verify admin access
    if (!validateAdminAccess(walletAddress)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Check if this is a gallery/voting contest to include vote counts
    const includeVotes = searchParams.get('includeVotes') === 'true';

    // Get ALL submissions (pending, approved, rejected)
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .order('submitted_at', { ascending: false });

    if (subError) {
      console.error('Error fetching submissions:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // If votes requested, get vote counts
    if (includeVotes) {
      const { data: votes, error: voteError } = await supabaseAdmin
        .from('contest_votes')
        .select('submission_id')
        .eq('contest_id', contestId);

      if (voteError) {
        console.error('Error fetching votes:', voteError);
        return NextResponse.json(
          { error: 'Failed to fetch votes' },
          { status: 500 }
        );
      }

      // Count votes per submission
      const voteCounts: { [key: string]: number } = {};
      votes?.forEach(vote => {
        voteCounts[vote.submission_id] = (voteCounts[vote.submission_id] || 0) + 1;
      });

      // Add vote counts to submissions
      const submissionsWithVotes = submissions?.map(submission => ({
        ...submission,
        vote_count: voteCounts[submission.id] || 0
      }));

      return NextResponse.json({
        success: true,
        submissions: submissionsWithVotes || []
      });
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || []
    });

  } catch (error) {
    console.error('Error in admin submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
