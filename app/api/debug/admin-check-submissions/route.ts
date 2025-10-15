// Debug endpoint using admin client to bypass RLS
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const contestId = searchParams.get('contestId');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Get ALL submissions for this wallet using ADMIN CLIENT
    const { data: allSubmissions, error: allError } = await supabaseAdmin
      .from('contest_submissions')
      .select('id, contest_id, wallet_address, username, submitted_at, status, screenshot_url')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: false });

    if (allError) {
      console.error('Error fetching submissions:', allError);
      throw allError;
    }

    // Get submissions for specific contest if provided
    let contestSubmissions = null;
    if (contestId) {
      const { data, error } = await supabaseAdmin
        .from('contest_submissions')
        .select('*')
        .eq('contest_id', contestId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching contest submissions:', error);
        throw error;
      }
      contestSubmissions = data;
    }

    // Also check ALL submissions for the specific contest
    let allContestSubmissions = null;
    if (contestId) {
      const { data, error } = await supabaseAdmin
        .from('contest_submissions')
        .select('id, wallet_address, username, status, submitted_at')
        .eq('contest_id', contestId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching all contest submissions:', error);
      } else {
        allContestSubmissions = data;
      }
    }

    // Build detailed report
    const report = {
      wallet: walletAddress.toLowerCase(),
      total_submissions: allSubmissions?.length || 0,
      all_submissions: allSubmissions,
      specific_contest: contestId ? {
        contest_id: contestId,
        user_submissions: contestSubmissions,
        user_count: contestSubmissions?.length || 0,
        all_submissions_in_contest: allContestSubmissions,
        total_in_contest: allContestSubmissions?.length || 0
      } : null
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Admin debug check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
