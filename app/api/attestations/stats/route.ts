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
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Return mock data if Supabase not configured
    if (!supabase) {
      return NextResponse.json({
        totalAttestations: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastAttestationDate: null,
        rank: 0,
        canAttestToday: true,
        timeUntilNext: 0
      });
    }

    // Get user stats using the RPC function
    const { data, error } = await supabase
      .rpc('get_user_attestation_stats', { p_wallet_address: wallet.toLowerCase() });

    if (error) {
      console.error('Error fetching stats:', error);
      // Return default values if user has no stats yet
      return NextResponse.json({
        totalAttestations: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastAttestationDate: null,
        rank: 0,
        canAttestToday: true,
        timeUntilNext: 0
      });
    }

    // Parse the JSON response from the RPC function
    const stats = data || {};

    return NextResponse.json({
      totalAttestations: stats.total_attestations || 0,
      currentStreak: stats.current_streak || 0,
      bestStreak: stats.best_streak || 0,
      lastAttestationDate: stats.last_attestation_date || null,
      rank: stats.rank || 0,
      canAttestToday: stats.can_attest_today !== false,
      timeUntilNext: 0 // Could calculate from contract if needed
    });
  } catch (error) {
    console.error('Error in attestation stats API:', error);
    // Return default values on error
    return NextResponse.json({
      totalAttestations: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastAttestationDate: null,
      rank: 0,
      canAttestToday: true,
      timeUntilNext: 0
    });
  }
}