import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contestId, winners, adminWallet } = body;

    // Validate admin access
    if (!adminWallet || !validateAdminAccess(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    if (!contestId || !winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json(
        { error: 'Contest ID and winners array required' },
        { status: 400 }
      );
    }

    // Fetch contest to validate and get prize info
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Delete existing winners for this contest (in case of re-selection)
    await supabaseAdmin
      .from('contest_winners')
      .delete()
      .eq('contest_id', contestId);

    // Prepare winner records
    const winnerRecords = winners.map((winner: any, index: number) => ({
      contest_id: contestId,
      submission_id: winner.submissionId,
      wallet_address: winner.walletAddress.toLowerCase(),
      position: index + 1,
      prize_amount: winner.prizeAmount || null,
      prize_distributed: false,
      created_at: new Date().toISOString()
    }));

    // Insert new winners
    const { data: insertedWinners, error: insertError } = await supabaseAdmin
      .from('contest_winners')
      .insert(winnerRecords)
      .select();

    if (insertError) {
      console.error('Error inserting winners:', insertError);
      return NextResponse.json(
        { error: 'Failed to save winners', details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Saved ${insertedWinners.length} winners for contest ${contestId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${insertedWinners.length} winner(s)`,
      winners: insertedWinners
    });

  } catch (error) {
    console.error('Save winners error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch winners for a contest
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const adminWallet = searchParams.get('wallet');

    if (!adminWallet || !validateAdminAccess(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID required' },
        { status: 400 }
      );
    }

    // Fetch winners with submission details
    const { data: winners, error } = await supabaseAdmin
      .from('contest_winners')
      .select(`
        *,
        contest_submissions (
          username,
          score,
          screenshot_url,
          submitted_at,
          vote_count
        )
      `)
      .eq('contest_id', contestId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching winners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch winners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      winners: winners || [],
      count: winners?.length || 0
    });

  } catch (error) {
    console.error('Fetch winners error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}