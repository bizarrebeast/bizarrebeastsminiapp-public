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

    // Get user stats from the stats table
    const { data: stats, error } = await supabase
      .from('bizarre_attestation_stats')
      .select('*')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching stats:', error);
    }

    // Get user's rank from leaderboard view
    const { data: leaderboard } = await supabase
      .from('bizarre_attestation_leaderboard')
      .select('rank')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    const userRank = leaderboard?.rank || 0;

    return NextResponse.json({
      totalAttestations: stats?.total_attestations || 0,
      currentStreak: stats?.current_streak || 0,
      bestStreak: stats?.best_streak || 0,
      lastAttestationDate: stats?.last_attestation_date || null,
      rank: userRank,
      canAttestToday: true, // Let the frontend calculate based on last attestation
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