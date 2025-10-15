import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if credentials exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Return empty leaderboard if Supabase not configured
    if (!supabase) {
      return NextResponse.json([]);
    }

    // Get leaderboard using the view
    const { data: leaderboard, error } = await supabase
      .from('bizarre_attestation_leaderboard')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json([], { status: 200 });
    }

    // Format the response
    const formattedLeaderboard = (leaderboard || []).map(entry => ({
      rank: entry.rank,
      wallet_address: entry.wallet_address,
      username: entry.username || null,
      farcaster_fid: entry.farcaster_fid || null,
      total_attestations: entry.total_attestations,
      current_streak: entry.current_streak,
      best_streak: entry.best_streak
    }));

    return NextResponse.json(formattedLeaderboard);
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json([], { status: 200 });
  }
}