import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, ritualId, shared = false } = await request.json();

    if (!walletAddress || ritualId === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mark ritual as completed
    const { data, error } = await supabase
      .from('ritual_completions')
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        ritual_id: ritualId,
        date: new Date().toISOString().split('T')[0],
        shared,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address,ritual_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking ritual complete:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in complete ritual:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Get all completed rituals for the wallet on the specified date
    const { data: completions, error } = await supabase
      .from('ritual_completions')
      .select('ritual_id, shared')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('date', date);

    if (error) {
      console.error('Error fetching completions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get featured ritual completion
    const { data: featuredCompletion } = await supabase
      .from('featured_ritual_completions')
      .select('featured_ritual_id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('date', date)
      .single();

    return NextResponse.json({
      completedRituals: completions?.map(c => c.ritual_id) || [],
      sharedRituals: completions?.filter(c => c.shared).map(c => c.ritual_id) || [],
      featuredCompleted: !!featuredCompletion,
      date
    });
  } catch (error) {
    console.error('Error fetching ritual completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}