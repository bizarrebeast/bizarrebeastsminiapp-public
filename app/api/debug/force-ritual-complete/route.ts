import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, fid, ritualId } = await request.json();

    if (!ritualId) {
      return NextResponse.json({ error: 'Missing ritual ID' }, { status: 400 });
    }

    // For Vlad's case
    const wallet = walletAddress || '0xfb70c8B3d0cbd18F5bCaf871831166bBf78CF742';
    const userFid = fid || 1025376;

    // Force insert a ritual completion
    const { data, error } = await supabase
      .from('ritual_completions')
      .insert({
        wallet_address: wallet.toLowerCase(),
        fid: userFid,
        ritual_id: ritualId,
        ritual_title: `Ritual ${ritualId}`,
        completed: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error forcing ritual completion:', error);
      return NextResponse.json({
        error: 'Failed to insert',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Check if it's queryable
    const { data: checkData } = await supabase
      .from('ritual_completions')
      .select('*')
      .eq('fid', userFid)
      .eq('ritual_id', ritualId);

    return NextResponse.json({
      success: true,
      inserted: data,
      queryCheck: {
        found: checkData?.length || 0,
        records: checkData
      }
    });
  } catch (error) {
    console.error('Error in force complete:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}