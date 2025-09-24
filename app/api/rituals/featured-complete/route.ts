import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, featuredRitualId } = await request.json();

    if (!walletAddress || !featuredRitualId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mark featured ritual as completed
    const { data, error } = await supabase
      .from('featured_ritual_completions')
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        featured_ritual_id: featuredRitualId,
        date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address,featured_ritual_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking featured ritual complete:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in complete featured ritual:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}