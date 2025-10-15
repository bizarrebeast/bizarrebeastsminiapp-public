/**
 * GET /api/flip/stats/:walletAddress
 * Get player statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get player stats
    const { data: stats, error: statsError } = await supabase
      .from('coin_flip_leaderboard')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // If no stats, return defaults
    if (!stats) {
      return NextResponse.json({
        walletAddress: walletAddress.toLowerCase(),
        totalFlips: 0,
        totalWins: 0,
        totalLosses: 0,
        netProfit: '0',
        winRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        biggestWin: '0',
        totalWagered: '0',
        firstFlipAt: null,
        lastFlipAt: null
      });
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in /api/flip/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
