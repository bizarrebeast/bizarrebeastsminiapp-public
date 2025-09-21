import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const contestId = 'd8ace9a2-2016-482b-9c41-913e07c3008b';
  const testWallet = '0x4f2ecda8c10ec8fbe711f6664970826998b81c3e';

  try {
    console.log('🧪 TEST: Starting submission check test');

    // Test 1: Can we fetch the contest?
    console.log('🧪 TEST 1: Fetching contest...');
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError) {
      return NextResponse.json({
        error: 'Contest fetch failed',
        details: contestError
      }, { status: 500 });
    }

    console.log('🧪 Contest found:', contest?.name, 'Max entries:', contest?.max_entries_per_wallet);

    // Test 2: Can we check existing submissions?
    console.log('🧪 TEST 2: Checking existing submissions...');
    const { data: submissions, error: subError } = await supabase
      .from('contest_submissions')
      .select('id')
      .eq('contest_id', contestId)
      .eq('wallet_address', testWallet.toLowerCase());

    if (subError) {
      return NextResponse.json({
        error: 'Submission check failed',
        details: subError
      }, { status: 500 });
    }

    const count = submissions?.length || 0;
    console.log('🧪 Existing submissions:', count);

    // Test 3: Check if user can submit more
    const canSubmit = count < (contest?.max_entries_per_wallet || 1);

    return NextResponse.json({
      success: true,
      contest: {
        id: contest?.id,
        name: contest?.name,
        max_entries_per_wallet: contest?.max_entries_per_wallet
      },
      testWallet,
      existingSubmissions: count,
      canSubmitMore: canSubmit,
      message: canSubmit
        ? `Can submit ${(contest?.max_entries_per_wallet || 1) - count} more entries`
        : 'Already at max submissions'
    });

  } catch (error) {
    console.error('🧪 TEST ERROR:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}