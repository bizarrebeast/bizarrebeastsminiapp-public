import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if credentials exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { wallet, txHash, blockNumber, gasUsed } = await request.json();

    if (!wallet || !txHash) {
      return NextResponse.json(
        { error: 'Wallet address and transaction hash required' },
        { status: 400 }
      );
    }

    // If Supabase not configured, return mock success
    if (!supabase) {
      return NextResponse.json({
        success: true,
        attestation: { wallet, txHash },
        stats: null,
        milestones: []
      });
    }

    // Get user's Farcaster info if available
    const { data: userData } = await supabase
      .from('unified_users')
      .select('farcaster_fid, farcaster_username')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    // Record attestation
    const { data: attestation, error: attestError } = await supabase
      .from('bizarre_attestations')
      .insert({
        wallet_address: wallet.toLowerCase(),
        farcaster_fid: userData?.farcaster_fid || null,
        username: userData?.farcaster_username || null,
        tx_hash: txHash,
        block_number: blockNumber || 0,
        gas_price: gasUsed || null,
        attestation_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (attestError) {
      // Check if it's a duplicate attestation for today
      if (attestError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already attested today' },
          { status: 409 }
        );
      }
      throw attestError;
    }

    // The trigger will automatically update stats, but we can also
    // check for milestones here if needed
    const { data: stats } = await supabase
      .from('bizarre_attestation_stats')
      .select('*')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    // Check for milestone achievements
    const milestones = [];
    if (stats) {
      if (stats.current_streak === 7) milestones.push({ type: 'WEEK_WARRIOR', streak: 7 });
      if (stats.current_streak === 14) milestones.push({ type: 'FORTNIGHT_FIGHTER', streak: 14 });
      if (stats.current_streak === 30) milestones.push({ type: 'BIZARRE_LEGEND', streak: 30 });
      if (stats.total_attestations === 100) milestones.push({ type: 'CENTURION', total: 100 });
    }

    return NextResponse.json({
      success: true,
      attestation,
      stats,
      milestones
    });
  } catch (error: any) {
    console.error('Error recording attestation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record attestation' },
      { status: 500 }
    );
  }
}