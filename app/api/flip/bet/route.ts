/**
 * POST /api/flip/bet
 * Place a new coin flip bet
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSeed, hashSeed } from '@/lib/flip/provably-fair';

// Minimum bet: 10,000 $BB (in wei)
const MIN_BET = BigInt('10000000000000000000000');
// Maximum bet: 500,000 $BB (in wei)
const MAX_BET = BigInt('500000000000000000000000');
// Daily limit: 10,000,000 $BB (in wei)
const DAILY_LIMIT = BigInt('10000000000000000000000000');
// Minimum balance required: 5,000,000 $BB (in wei)
const MIN_BALANCE = BigInt('5000000000000000000000000');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      amount,
      choice, // 'heads' or 'tails'
      clientSeedHash,
      farcasterFid,
      farcasterUsername,
      currentStreak = 0,
    } = body;

    // Validation
    if (!walletAddress || !amount || !choice || !clientSeedHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (choice !== 'heads' && choice !== 'tails') {
      return NextResponse.json(
        { error: 'Invalid choice. Must be "heads" or "tails"' },
        { status: 400 }
      );
    }

    // Convert amount to BigInt
    const betAmount = BigInt(amount);

    // Validate bet amount
    if (betAmount < MIN_BET || betAmount > MAX_BET) {
      return NextResponse.json(
        {
          error: `Bet must be between ${MIN_BET.toString()} and ${MAX_BET.toString()} wei`,
          minBet: MIN_BET.toString(),
          maxBet: MAX_BET.toString()
        },
        { status: 400 }
      );
    }

    // TODO: Check user's $BB balance
    // This would integrate with your token contract
    // For now, we'll skip this check in development

    // Check self-exclusion
    const { data: exclusion } = await supabase
      .from('coin_flip_self_exclusions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .gt('end_date', new Date().toISOString())
      .single();

    if (exclusion) {
      return NextResponse.json(
        { error: 'You are self-excluded from playing' },
        { status: 403 }
      );
    }

    // Check daily limit
    const { data: dailyLimit } = await supabase
      .from('coin_flip_daily_limits')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    const totalWageredToday = BigInt(dailyLimit?.total_wagered || '0');
    if ((totalWageredToday + betAmount) > DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily betting limit exceeded',
          dailyLimit: DAILY_LIMIT.toString(),
          wageredToday: totalWageredToday.toString()
        },
        { status: 403 }
      );
    }

    // Generate server seed and hash it
    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);

    // Calculate streak multiplier
    const streakMultiplier = getStreakMultiplier(currentStreak + 1);

    // Get client IP for tracking
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create bet record (store server seed for now - in production use encryption)
    const { data: bet, error: betError } = await supabase
      .from('coin_flip_bets')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        farcaster_fid: farcasterFid,
        farcaster_username: farcasterUsername,
        amount: betAmount.toString(),
        choice,
        client_seed_hash: clientSeedHash,
        server_seed: serverSeed, // TODO: encrypt in production
        server_seed_hash: serverSeedHash,
        streak_level: currentStreak + 1,
        streak_multiplier: streakMultiplier,
        status: 'pending',
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single();

    if (betError) {
      console.error('Error creating bet:', betError);
      return NextResponse.json(
        { error: 'Failed to create bet', details: betError.message },
        { status: 500 }
      );
    }

    // Store server seed encrypted (in production, use proper key management)
    // For now, we'll return it and client must reveal their seed to proceed
    // In production, server seed would be stored encrypted and revealed only after client reveals

    // Return bet details WITHOUT server seed
    return NextResponse.json({
      success: true,
      betId: bet.id,
      serverSeedHash,
      streakMultiplier,
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes to reveal
      message: 'Bet placed! Reveal your seed to flip the coin.'
    });

  } catch (error) {
    console.error('Error in /api/flip/bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get streak multiplier
function getStreakMultiplier(winCount: number): number {
  if (winCount <= 1) return 1.0;
  if (winCount === 2) return 1.2;
  if (winCount === 3) return 1.5;
  if (winCount === 4) return 2.0;
  if (winCount === 5) return 3.0;
  return 5.0; // 6+ wins
}
