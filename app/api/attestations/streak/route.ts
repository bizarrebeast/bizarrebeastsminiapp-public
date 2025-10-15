import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get user's attestation stats including streaks
    const { data, error } = await supabase
      .from('bizarre_attestation_stats')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // Return streak data or default values
    const streakData = {
      wallet_address: walletAddress.toLowerCase(),
      current_streak: data?.current_streak || 0,
      best_streak: data?.best_streak || 0,
      total_attestations: data?.total_attestations || 0,
      last_attestation_date: data?.last_attestation_date || null,
      first_attestation_date: data?.first_attestation_date || null,
      // Milestone achievements
      has_30_day_milestone: (data?.best_streak || 0) >= 30,
      has_100_day_milestone: (data?.best_streak || 0) >= 100,
      // BIZARRE tier eligibility through dedication path
      has_bizarre_tier_override: (data?.best_streak || 0) >= 100
    };

    return NextResponse.json(streakData);
  } catch (error) {
    console.error('Error fetching attestation streak:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}