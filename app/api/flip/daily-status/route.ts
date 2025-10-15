/**
 * POST /api/flip/daily-status
 * Check if user can flip today (considers tier-based daily flips + bonus spins)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserTierInfo } from '@/lib/flip/tier-helper';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, farcasterFid } = await request.json();

    if (!walletAddress && !farcasterFid) {
      return NextResponse.json(
        { error: 'Must provide wallet address or Farcaster FID' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get user's tier based on verified wallet (FID-first approach)
    const tierInfo = await getUserTierInfo(walletAddress, farcasterFid);
    const { tier: userTier, empireRank, maxDailyFlips } = tierInfo;

    console.log(`[daily-status] Tier info: tier=${userTier}, rank=${empireRank}, max flips=${maxDailyFlips}, wallet used=${tierInfo.walletUsedForTier}`);

    // Count daily flips used today (FID-first tracking for consistent user experience)
    let dailyFlipsQuery = supabaseAdmin
      .from('coin_flip_bets')
      .select('id')
      .eq('daily_flip_date', today)
      .eq('is_free_daily_flip', true);

    // Use FID if available (most Farcaster users), otherwise wallet (desktop users)
    if (farcasterFid) {
      dailyFlipsQuery = dailyFlipsQuery.eq('farcaster_fid', farcasterFid);
      console.log(`[daily-status] Tracking flips by FID: ${farcasterFid}`);
    } else if (walletAddress) {
      dailyFlipsQuery = dailyFlipsQuery.eq('wallet_address', walletAddress.toLowerCase());
      console.log(`[daily-status] Tracking flips by wallet: ${walletAddress}`);
    }

    const { data: dailyFlips } = await dailyFlipsQuery;
    const flipsUsedToday = dailyFlips?.length || 0;
    const flipsRemaining = Math.max(0, maxDailyFlips - flipsUsedToday);

    // Check for bonus spins (FID-first tracking)
    let bonusQuery = supabaseAdmin
      .from('flip_bonus_spins')
      .select('*')
      .gt('bonus_spins_remaining', 0)
      .or('expires_at.is.null,expires_at.gt.now()');

    // Use FID if available, otherwise wallet
    if (farcasterFid) {
      bonusQuery = bonusQuery.eq('farcaster_fid', farcasterFid);
    } else if (walletAddress) {
      bonusQuery = bonusQuery.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data: bonusSpins } = await bonusQuery.single();
    const bonusSpinsRemaining = bonusSpins?.bonus_spins_remaining || 0;
    const hasBonusSpins = bonusSpinsRemaining > 0;

    // Get monthly entries
    const month = new Date().toISOString().slice(0, 7) + '-01'; // '2025-10-01'
    const { data: monthlyEntry } = await supabaseAdmin
      .from('flip_monthly_entries')
      .select('total_entries')
      .eq('wallet_address', walletAddress?.toLowerCase() || '')
      .eq('month', month)
      .single();

    const myEntries = monthlyEntry?.total_entries || 0;

    // Calculate next daily flip time (midnight UTC - same as rituals reset)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const nextFlipTime = tomorrow.toISOString();

    // User can flip if: (has remaining daily flips) OR (has bonus spins)
    const canFlip = flipsRemaining > 0 || hasBonusSpins;

    return NextResponse.json({
      canFlip,
      hasBonusSpins,
      bonusSpinsRemaining,
      bonusSpinReason: bonusSpins?.reason || null,
      bonusSpinExpiresAt: bonusSpins?.expires_at || null,
      nextFlipTime,
      myEntries,
      // Tier-based flip info
      userTier,
      empireRank,
      maxDailyFlips,
      flipsUsedToday,
      flipsRemaining,
      dailyFlipUsed: flipsUsedToday >= maxDailyFlips, // All daily flips used
      reason: hasBonusSpins
        ? 'Bonus spin available'
        : flipsRemaining > 0
        ? `${flipsRemaining} daily flip(s) remaining`
        : 'All daily flips used'
    });

  } catch (error) {
    console.error('Error in /api/flip/daily-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
