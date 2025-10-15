/**
 * POST /api/flip/claim
 * Execute a free daily flip (with or without bonus spin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateSeed, hashSeed, determineResult } from '@/lib/flip/provably-fair';
import { getUserTierInfo } from '@/lib/flip/tier-helper';

const PRIZE_AMOUNT = '5000000000000000000000'; // 5000 $BB in wei

export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      farcasterFid,
      farcasterUsername,
      choice
    } = await request.json();

    // Validation
    if (!walletAddress && !farcasterFid) {
      return NextResponse.json(
        { error: 'Must provide wallet address or Farcaster FID' },
        { status: 400 }
      );
    }

    if (choice !== 'heads' && choice !== 'tails') {
      return NextResponse.json(
        { error: 'Invalid choice. Must be "heads" or "tails"' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get user's tier based on verified wallet (FID-first approach)
    const tierInfo = await getUserTierInfo(walletAddress, farcasterFid);
    const { tier: userTier, maxDailyFlips } = tierInfo;

    console.log(`[claim] Tier info: tier=${userTier}, max flips=${maxDailyFlips}, wallet used=${tierInfo.walletUsedForTier}`);

    // Count daily flips used today (FID-first tracking for consistent user experience)
    let dailyFlipQuery = supabaseAdmin
      .from('coin_flip_bets')
      .select('id')
      .eq('daily_flip_date', today)
      .eq('is_free_daily_flip', true);

    // Use FID if available (most Farcaster users), otherwise wallet (desktop users)
    if (farcasterFid) {
      dailyFlipQuery = dailyFlipQuery.eq('farcaster_fid', farcasterFid);
      console.log(`[claim] Tracking flips by FID: ${farcasterFid}`);
    } else if (walletAddress) {
      dailyFlipQuery = dailyFlipQuery.eq('wallet_address', walletAddress.toLowerCase());
      console.log(`[claim] Tracking flips by wallet: ${walletAddress}`);
    }

    const { data: dailyFlips } = await dailyFlipQuery;
    const flipsUsedToday = dailyFlips?.length || 0;
    const flipsRemaining = Math.max(0, maxDailyFlips - flipsUsedToday);
    const dailyFlipNumber = flipsUsedToday + 1; // Next flip number

    // Check bonus spins (FID-first tracking)
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
    const hasBonusSpins = bonusSpins && bonusSpins.bonus_spins_remaining > 0;

    // Determine if this is a bonus flip or daily flip
    // It's a bonus flip if: user has used all tier-based daily flips AND has bonus spins
    const allDailyFlipsUsed = flipsRemaining === 0;
    const isBonusFlip = hasBonusSpins && allDailyFlipsUsed;
    const canFlip = flipsRemaining > 0 || hasBonusSpins;

    if (!canFlip) {
      return NextResponse.json(
        {
          error: `No flips available. You've used all ${maxDailyFlips} daily flips and have no bonus spins.`,
          userTier,
          maxDailyFlips,
          flipsUsedToday
        },
        { status: 429 }
      );
    }

    // Generate provably fair result
    const serverSeed = generateSeed();
    const clientSeed = generateSeed(); // For free flips, we generate client seed too (simplified)
    const clientSeedHash = hashSeed(clientSeed);
    const serverSeedHash = hashSeed(serverSeed);
    const combinedHash = hashSeed(serverSeed + clientSeed);

    // Determine result
    const result = determineResult(combinedHash);
    const isWinner = result === choice;
    const payout = isWinner ? PRIZE_AMOUNT : '0';

    // Get IP and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create flip record
    const { data: flip, error: flipError } = await supabaseAdmin
      .from('coin_flip_bets')
      .insert({
        wallet_address: walletAddress?.toLowerCase() || null,
        farcaster_fid: farcasterFid || null,
        farcaster_username: farcasterUsername || null,
        amount: '0', // Free flip
        choice,
        client_seed_hash: clientSeedHash,
        client_seed: clientSeed,
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
        combined_hash: combinedHash,
        result,
        is_winner: isWinner,
        payout,
        is_free_daily_flip: !isBonusFlip,
        is_bonus_flip: isBonusFlip,
        daily_flip_date: today,
        status: 'revealed',
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single();

    if (flipError) {
      console.error('Error creating flip:', flipError);
      return NextResponse.json(
        { error: 'Failed to create flip', details: flipError.message },
        { status: 500 }
      );
    }

    // If using bonus spin, decrement it
    if (isBonusFlip) {
      await supabaseAdmin
        .from('flip_bonus_spins')
        .update({
          bonus_spins_remaining: bonusSpins.bonus_spins_remaining - 1,
          last_used_at: new Date().toISOString(),
          total_used: (bonusSpins.total_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', bonusSpins.id);
    }

    // Increment monthly entries
    // Increment monthly entries (RPC handles both insert and update)
    const month = new Date().toISOString().slice(0, 7) + '-01'; // '2025-10-01'
    await supabaseAdmin
      .rpc('increment_monthly_entries', {
        p_wallet: walletAddress?.toLowerCase() || 'unknown',
        p_fid: farcasterFid || null,
        p_username: farcasterUsername || null,
        p_is_bonus: isBonusFlip
      });

    // Get updated entry count
    const { data: updatedEntry } = await supabaseAdmin
      .from('flip_monthly_entries')
      .select('total_entries')
      .eq('wallet_address', walletAddress?.toLowerCase() || 'unknown')
      .eq('month', month)
      .single();

    const totalEntries = updatedEntry?.total_entries || 1;

    // Update player stats (reuse existing function)
    await supabaseAdmin.rpc('update_flip_stats', {
      p_wallet: walletAddress?.toLowerCase() || 'unknown',
      p_fid: farcasterFid || null,
      p_username: farcasterUsername || null,
      p_won: isWinner,
      p_amount: 0, // Free flip
      p_payout: isWinner ? PRIZE_AMOUNT : '0',
      p_streak: 0, // No streaks for free flips (for now)
      p_cashed_out: false
    });

    // Update banking balance (credit winnings to be withdrawn later)
    if (isWinner && walletAddress) {
      try {
        const { data: existingBalance, error: balanceError } = await supabaseAdmin
          .from('flip_player_balances')
          .select('*')
          .eq('wallet_address', walletAddress.toLowerCase())
          .maybeSingle();

        if (balanceError) {
          console.error('Error fetching balance:', balanceError);
        }

        if (existingBalance) {
          // Increment existing balance
          const newTotalWon = (BigInt(existingBalance.total_won || 0) + BigInt(PRIZE_AMOUNT)).toString();
          const newPendingBalance = (BigInt(existingBalance.pending_balance || 0) + BigInt(PRIZE_AMOUNT)).toString();

          const { error: updateError } = await supabaseAdmin
            .from('flip_player_balances')
            .update({
              total_won: newTotalWon,
              pending_balance: newPendingBalance,
              updated_at: new Date().toISOString()
            })
            .eq('wallet_address', walletAddress.toLowerCase());

          if (updateError) {
            console.error('Error updating balance:', updateError);
          }
        } else {
          // Create new balance record
          const { error: insertError } = await supabaseAdmin
            .from('flip_player_balances')
            .insert({
              wallet_address: walletAddress.toLowerCase(),
              farcaster_fid: farcasterFid || null,
              farcaster_username: farcasterUsername || null,
              total_won: PRIZE_AMOUNT,
              pending_balance: PRIZE_AMOUNT
            });

          if (insertError) {
            console.error('Error inserting balance:', insertError);
          }
        }
      } catch (balanceErr) {
        console.error('Banking error (non-critical):', balanceErr);
        // Don't fail the flip if banking fails
      }
    }

    // Return result
    return NextResponse.json({
      success: true,
      flipId: flip.id,
      result,
      isWinner,
      prize: isWinner ? '5000' : '0', // Return as $BB amount
      prizeWei: payout,
      isBonusFlip,
      totalEntries,
      // Tier-based flip info
      userTier,
      maxDailyFlips,
      flipsUsedToday: isBonusFlip ? flipsUsedToday : dailyFlipNumber,
      flipsRemaining: isBonusFlip ? 0 : Math.max(0, maxDailyFlips - dailyFlipNumber),
      breakdown: {
        serverSeed: serverSeed, // For transparency
        clientSeed: clientSeed,
        combinedHash: combinedHash,
        result
      },
      message: isWinner
        ? '🎉 You won 5,000 $BB! Entry added to monthly drawing.'
        : '😢 Better luck tomorrow! Entry added to monthly drawing.'
    });

  } catch (error) {
    console.error('Error in /api/flip/claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
