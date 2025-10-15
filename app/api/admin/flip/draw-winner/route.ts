/**
 * POST /api/admin/flip/draw-winner
 * Draw monthly prize winner (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { month } = await request.json(); // '2025-10-01'

    if (!month) {
      return NextResponse.json(
        { error: 'Missing required field: month' },
        { status: 400 }
      );
    }

    // Get prize info
    const { data: prize, error: prizeError } = await supabase
      .from('flip_monthly_prizes')
      .select('*')
      .eq('month', month)
      .single();

    if (prizeError || !prize) {
      return NextResponse.json(
        { error: 'Prize not found for this month' },
        { status: 404 }
      );
    }

    // Check if already drawn
    if (prize.status === 'drawn' || prize.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Winner already drawn for this month',
          winner: {
            username: prize.winner_username,
            wallet: prize.winner_wallet,
            fid: prize.winner_fid,
            totalEntries: prize.winner_total_entries
          }
        },
        { status: 400 }
      );
    }

    // Get all entries for this month
    const { data: entries, error: entriesError } = await supabase
      .from('flip_monthly_entries')
      .select('*')
      .eq('month', month)
      .order('total_entries', { ascending: false });

    if (entriesError || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found for this month' },
        { status: 400 }
      );
    }

    // Create weighted pool (each entry = one ticket)
    const pool: { wallet: string; fid: number | null; username: string | null; totalEntries: number }[] = [];
    let totalPoolEntries = 0;

    entries.forEach(entry => {
      // Add entry N times (N = total_entries)
      for (let i = 0; i < entry.total_entries; i++) {
        pool.push({
          wallet: entry.wallet_address,
          fid: entry.farcaster_fid,
          username: entry.farcaster_username,
          totalEntries: entry.total_entries
        });
        totalPoolEntries++;
      }
    });

    // Provably fair random selection
    // Use crypto.randomInt for secure randomness
    const winnerIndex = crypto.randomInt(0, pool.length);
    const winnerEntry = pool[winnerIndex];

    // Find full entry data
    const fullWinnerData = entries.find(e => e.wallet_address === winnerEntry.wallet);

    if (!fullWinnerData) {
      return NextResponse.json(
        { error: 'Failed to find winner data' },
        { status: 500 }
      );
    }

    // Record winner
    const { error: winnerError } = await supabase
      .from('flip_monthly_winners')
      .insert({
        month,
        wallet_address: fullWinnerData.wallet_address,
        farcaster_fid: fullWinnerData.farcaster_fid,
        farcaster_username: fullWinnerData.farcaster_username,
        prize_name: prize.prize_name,
        prize_description: prize.prize_description,
        total_entries: fullWinnerData.total_entries,
        total_participants: entries.length,
        total_pool_entries: totalPoolEntries,
        winning_entry_number: winnerIndex + 1, // 1-indexed for display
        drawn_at: new Date().toISOString()
      });

    if (winnerError) {
      console.error('Error recording winner:', winnerError);
      return NextResponse.json(
        { error: 'Failed to record winner', details: winnerError.message },
        { status: 500 }
      );
    }

    // Update prize status
    const { error: updateError } = await supabase
      .from('flip_monthly_prizes')
      .update({
        status: 'drawn',
        winner_wallet: fullWinnerData.wallet_address,
        winner_fid: fullWinnerData.farcaster_fid,
        winner_username: fullWinnerData.farcaster_username,
        winner_total_entries: fullWinnerData.total_entries,
        winner_announced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('month', month);

    if (updateError) {
      console.error('Error updating prize:', updateError);
      // Winner is recorded, so continue
    }

    return NextResponse.json({
      success: true,
      winner: {
        wallet: fullWinnerData.wallet_address,
        fid: fullWinnerData.farcaster_fid,
        username: fullWinnerData.farcaster_username,
        totalEntries: fullWinnerData.total_entries,
        winningEntryNumber: winnerIndex + 1,
        odds: `${fullWinnerData.total_entries}/${totalPoolEntries} (${((fullWinnerData.total_entries / totalPoolEntries) * 100).toFixed(2)}%)`
      },
      prize: {
        name: prize.prize_name,
        description: prize.prize_description,
        value: prize.prize_value
      },
      stats: {
        totalParticipants: entries.length,
        totalEntries: totalPoolEntries,
        drawingMethod: 'Weighted random (crypto.randomInt)',
        timestamp: new Date().toISOString()
      },
      message: `Winner drawn! ${fullWinnerData.farcaster_username || fullWinnerData.wallet_address} won with ${fullWinnerData.total_entries} entries out of ${totalPoolEntries} total.`
    });

  } catch (error) {
    console.error('Error in /api/admin/flip/draw-winner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/flip/draw-winner
 * Get drawing stats for a month (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) + '-01';

    // Get entries
    const { data: entries } = await supabase
      .from('flip_monthly_entries')
      .select('*')
      .eq('month', month);

    const totalParticipants = entries?.length || 0;
    const totalEntries = entries?.reduce((sum, e) => sum + e.total_entries, 0) || 0;

    // Get prize
    const { data: prize } = await supabase
      .from('flip_monthly_prizes')
      .select('*')
      .eq('month', month)
      .single();

    // Get winner if drawn
    const { data: winner } = await supabase
      .from('flip_monthly_winners')
      .select('*')
      .eq('month', month)
      .single();

    return NextResponse.json({
      month,
      prize: prize ? {
        name: prize.prize_name,
        status: prize.status,
        drawingDate: prize.drawing_date
      } : null,
      stats: {
        totalParticipants,
        totalEntries,
        avgEntriesPerUser: totalParticipants > 0 ? (totalEntries / totalParticipants).toFixed(1) : 0,
        readyToDraw: prize?.status === 'active' && totalParticipants > 0
      },
      winner: winner ? {
        wallet: winner.wallet_address,
        username: winner.farcaster_username,
        totalEntries: winner.total_entries,
        drawnAt: winner.drawn_at
      } : null
    });

  } catch (error) {
    console.error('Error in GET /api/admin/flip/draw-winner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
