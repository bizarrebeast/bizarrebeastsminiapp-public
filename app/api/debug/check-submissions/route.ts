// Debug endpoint to check user's submissions across contests
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const contestId = searchParams.get('contestId');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Get ALL submissions for this wallet
    const { data: allSubmissions, error: allError } = await supabase
      .from('contest_submissions')
      .select('id, contest_id, wallet_address, submitted_at, status')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: false });

    if (allError) throw allError;

    // Get submissions for specific contest if provided
    let contestSubmissions = null;
    if (contestId) {
      const { data, error } = await supabase
        .from('contest_submissions')
        .select('*')
        .eq('contest_id', contestId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      contestSubmissions = data;
    }

    // Group all submissions by contest
    const groupedByContest = allSubmissions?.reduce((acc: any, sub: any) => {
      if (!acc[sub.contest_id]) {
        acc[sub.contest_id] = [];
      }
      acc[sub.contest_id].push(sub);
      return acc;
    }, {}) || {};

    // Get contest details for each unique contest
    const contestIds = Object.keys(groupedByContest);
    const { data: contests } = await supabase
      .from('contests')
      .select('id, name, max_entries_per_wallet')
      .in('id', contestIds);

    const contestMap = contests?.reduce((acc: any, c: any) => {
      acc[c.id] = c;
      return acc;
    }, {}) || {};

    // Build detailed report
    const report = {
      wallet: walletAddress.toLowerCase(),
      total_submissions: allSubmissions?.length || 0,
      submissions_by_contest: Object.entries(groupedByContest).map(([cId, subs]: [string, any]) => ({
        contest_id: cId,
        contest_name: contestMap[cId]?.name || 'Unknown Contest',
        max_allowed: contestMap[cId]?.max_entries_per_wallet || 1,
        submission_count: subs.length,
        is_over_limit: subs.length > (contestMap[cId]?.max_entries_per_wallet || 1),
        submissions: subs
      })),
      specific_contest: contestId ? {
        contest_id: contestId,
        submissions: contestSubmissions,
        count: contestSubmissions?.length || 0
      } : null
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Failed to check submissions' },
      { status: 500 }
    );
  }
}