/**
 * GET /api/flip/monthly-prize
 * Get current month's prize information (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current month
    const now = new Date();
    const month = now.toISOString().slice(0, 7) + '-01'; // '2025-10-01'

    // Get prize info for current month
    const { data: prize, error: prizeError } = await supabase
      .from('flip_monthly_prizes')
      .select('*')
      .eq('month', month)
      .single();

    if (prizeError || !prize) {
      return NextResponse.json({
        hasPrize: false,
        message: 'No prize configured for this month'
      });
    }

    // Get total entries for this month
    const { data: entriesData, error: entriesError } = await supabase
      .from('flip_monthly_entries')
      .select('total_entries')
      .eq('month', month);

    const totalEntries = entriesData?.reduce((sum, entry) => sum + entry.total_entries, 0) || 0;

    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('flip_monthly_entries')
      .select('*', { count: 'exact', head: true })
      .eq('month', month);

    // Return prize info
    return NextResponse.json({
      hasPrize: true,
      prize: {
        id: prize.id,
        month: prize.month,
        name: prize.prize_name,
        description: prize.prize_description,
        imageUrl: prize.prize_image_url,
        value: prize.prize_value,
        drawingDate: prize.drawing_date,
        status: prize.status,
        winner: prize.status === 'drawn' ? {
          username: prize.winner_username,
          totalEntries: prize.winner_total_entries
        } : null
      },
      stats: {
        totalEntries,
        totalParticipants: totalParticipants || 0
      }
    });

  } catch (error) {
    console.error('Error in /api/flip/monthly-prize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
