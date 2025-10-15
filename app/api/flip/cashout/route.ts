/**
 * POST /api/flip/cashout
 * Cash out current win streak
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cashoutAmount = BigInt(amount);

    // Get player's current stats
    const { data: stats, error: statsError } = await supabase
      .from('coin_flip_leaderboard')
      .select('current_streak, best_cashout')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch player stats' },
        { status: 500 }
      );
    }

    const currentStreak = stats?.current_streak || 0;

    if (currentStreak === 0) {
      return NextResponse.json(
        { error: 'No active streak to cash out' },
        { status: 400 }
      );
    }

    // Update stats with cashout
    const { error: updateError } = await supabase
      .from('coin_flip_leaderboard')
      .update({
        current_streak: 0, // Reset streak
        best_cashout: stats && cashoutAmount > BigInt(stats.best_cashout || '0')
          ? cashoutAmount.toString()
          : stats?.best_cashout,
        total_cashouts: supabase.rpc('increment', { amount: 1 }),
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress.toLowerCase());

    if (updateError) {
      console.error('Error updating stats:', updateError);
      return NextResponse.json(
        { error: 'Failed to process cashout' },
        { status: 500 }
      );
    }

    // TODO: Process payout transaction
    // In production, this would transfer tokens from hot wallet to player

    return NextResponse.json({
      success: true,
      amount: cashoutAmount.toString(),
      streak: currentStreak,
      message: `Cashed out ${cashoutAmount.toString()} $BB from ${currentStreak}-win streak!`
    });

  } catch (error) {
    console.error('Error in /api/flip/cashout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
