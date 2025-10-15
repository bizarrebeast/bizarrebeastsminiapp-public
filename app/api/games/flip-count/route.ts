import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/games/flip-count
 * Returns the total number of flips played in the coin toss game
 * Cached for 1 hour to reduce database load
 */
export async function GET() {
  try {
    // Get count of all flip bets
    const { count, error } = await supabaseAdmin
      .from('coin_flip_bets')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching flip count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flip count' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { count: count || 0 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error in flip-count API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
