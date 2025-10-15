/**
 * POST /api/flip/reveal
 * Reveal client seed and determine flip result
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  combineSeeds,
  determineResult,
  verifySeed,
  calculatePayout,
  generateProof
} from '@/lib/flip/provably-fair';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { betId, clientSeed } = body;

    // Validation
    if (!betId || !clientSeed) {
      return NextResponse.json(
        { error: 'Missing betId or clientSeed' },
        { status: 400 }
      );
    }

    // Get bet from database
    const { data: bet, error: betError } = await supabase
      .from('coin_flip_bets')
      .select('*')
      .eq('id', betId)
      .single();

    if (betError || !bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Check if bet is already revealed
    if (bet.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Bet already revealed',
          result: bet.result,
          isWinner: bet.is_winner
        },
        { status: 400 }
      );
    }

    // Verify client seed matches hash
    const clientSeedHash = bet.client_seed_hash;
    if (!verifySeed(clientSeed, clientSeedHash)) {
      return NextResponse.json(
        { error: 'Client seed does not match hash' },
        { status: 400 }
      );
    }

    // Retrieve server seed from database
    // NOTE: In production, this should be encrypted at rest
    const serverSeed = bet.server_seed;
    const serverSeedHash = bet.server_seed_hash;

    if (!serverSeed) {
      return NextResponse.json(
        { error: 'Server seed not found' },
        { status: 500 }
      );
    }

    // Combine seeds and determine result
    const combinedHash = combineSeeds(clientSeed, serverSeed);
    const result = determineResult(combinedHash);
    const isWinner = result === bet.choice;

    // Calculate payout
    const betAmount = BigInt(bet.amount);
    const { netPayout, houseFee, burnAmount } = calculatePayout(
      betAmount,
      isWinner,
      bet.streak_multiplier
    );

    // Update bet with results
    const { error: updateError } = await supabase
      .from('coin_flip_bets')
      .update({
        client_seed: clientSeed,
        server_seed: serverSeed,
        combined_hash: combinedHash,
        result,
        is_winner: isWinner,
        payout: netPayout.toString(),
        status: 'revealed',
        revealed_at: new Date().toISOString()
      })
      .eq('id', betId);

    if (updateError) {
      console.error('Error updating bet:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bet' },
        { status: 500 }
      );
    }

    // Update player stats
    const newStreak = isWinner ? bet.streak_level : 0;
    const cashedOut = false; // Not cashing out, continuing to play

    const { error: statsError } = await supabase
      .rpc('update_flip_stats', {
        p_wallet: bet.wallet_address,
        p_fid: bet.farcaster_fid,
        p_username: bet.farcaster_username,
        p_won: isWinner,
        p_amount: betAmount.toString(),
        p_payout: netPayout.toString(),
        p_streak: newStreak,
        p_cashed_out: cashedOut
      });

    if (statsError) {
      console.error('Error updating stats:', statsError);
      // Don't fail the request, stats can be updated later
    }

    // Generate proof for verification
    const proof = generateProof(
      betId,
      clientSeed,
      clientSeedHash,
      serverSeed,
      serverSeedHash,
      bet.choice as 'heads' | 'tails'
    );

    // TODO: Process payout transaction
    // In production, this would:
    // 1. Transfer tokens from hot wallet to player
    // 2. Transfer house fee to cold wallet
    // 3. Transfer burn amount to burn address
    // 4. Record transaction hashes

    return NextResponse.json({
      success: true,
      result,
      isWinner,
      payout: netPayout.toString(),
      currentStreak: newStreak,
      proof,
      breakdown: {
        betAmount: betAmount.toString(),
        grossPayout: (betAmount * BigInt(2)).toString(),
        houseFee: houseFee.toString(),
        burnAmount: burnAmount.toString(),
        netPayout: netPayout.toString(),
        streakMultiplier: bet.streak_multiplier
      }
    });

  } catch (error) {
    console.error('Error in /api/flip/reveal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
