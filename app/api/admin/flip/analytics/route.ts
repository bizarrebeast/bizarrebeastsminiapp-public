/**
 * GET /api/admin/flip/analytics
 * Get overall flip game analytics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get total flips count
    const { count: totalFlips } = await supabaseAdmin
      .from('coin_flip_bets')
      .select('*', { count: 'exact', head: true })
      .eq('is_free_daily_flip', true);

    // Get unique players
    const { data: uniquePlayers } = await supabaseAdmin
      .from('coin_flip_bets')
      .select('wallet_address')
      .eq('is_free_daily_flip', true)
      .not('wallet_address', 'is', null);

    const uniqueWallets = new Set(uniquePlayers?.map(p => p.wallet_address));

    // Get total winnings
    const { data: winnings } = await supabaseAdmin
      .from('flip_player_balances')
      .select('total_won');

    const totalWinnings = winnings?.reduce((sum, b) => {
      return sum + BigInt(b.total_won || 0);
    }, BigInt(0)) || BigInt(0);

    // Get total withdrawals
    const { data: withdrawals } = await supabaseAdmin
      .from('flip_player_balances')
      .select('total_withdrawn');

    const totalWithdrawals = withdrawals?.reduce((sum, b) => {
      return sum + BigInt(b.total_withdrawn || 0);
    }, BigInt(0)) || BigInt(0);

    // Get recent flips (last 50)
    const { data: recentFlips } = await supabaseAdmin
      .from('coin_flip_bets')
      .select('*')
      .eq('is_free_daily_flip', true)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      totalFlips: totalFlips || 0,
      totalPlayers: uniqueWallets.size,
      totalWinnings: totalWinnings.toString(),
      totalWithdrawals: totalWithdrawals.toString(),
      recentFlips: recentFlips?.map(flip => ({
        id: flip.id,
        wallet: flip.wallet_address || 'unknown',
        username: flip.farcaster_username,
        choice: flip.choice,
        result: flip.result,
        isWinner: flip.is_winner,
        payout: flip.payout || '0',
        createdAt: flip.created_at,
        isBonusFlip: flip.is_bonus_flip || false
      })) || []
    });

  } catch (error) {
    console.error('Error in /api/admin/flip/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
