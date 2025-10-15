/**
 * GET /api/flip/verify/:betId
 * Verify a bet's provably fair outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyBetOutcome } from '@/lib/flip/provably-fair';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const betId = searchParams.get('betId');

    if (!betId) {
      return NextResponse.json(
        { error: 'Bet ID required' },
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

    // Check if bet is revealed
    if (bet.status !== 'revealed' && bet.status !== 'paid') {
      return NextResponse.json(
        { error: 'Bet not yet revealed' },
        { status: 400 }
      );
    }

    // Verify the bet
    const verification = verifyBetOutcome(
      bet.client_seed,
      bet.client_seed_hash,
      bet.server_seed,
      bet.server_seed_hash,
      bet.combined_hash,
      bet.result
    );

    return NextResponse.json({
      betId,
      isValid: verification.valid,
      errors: verification.errors,
      bet: {
        choice: bet.choice,
        result: bet.result,
        isWinner: bet.is_winner,
        amount: bet.amount,
        payout: bet.payout,
        streakLevel: bet.streak_level,
        streakMultiplier: bet.streak_multiplier,
        createdAt: bet.created_at,
        revealedAt: bet.revealed_at
      },
      proof: {
        clientSeed: bet.client_seed,
        clientSeedHash: bet.client_seed_hash,
        serverSeed: bet.server_seed,
        serverSeedHash: bet.server_seed_hash,
        combinedHash: bet.combined_hash
      }
    });

  } catch (error) {
    console.error('Error in /api/flip/verify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
