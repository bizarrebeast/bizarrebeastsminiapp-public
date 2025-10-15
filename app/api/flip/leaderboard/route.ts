/**
 * GET /api/flip/leaderboard
 * Get leaderboard rankings
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type SortBy =
  | 'profit'
  | 'volume'
  | 'wins'
  | 'streak'
  | 'win_rate'
  | 'biggest_win'
  | 'best_cashout'
  | 'total_flips';

type TimeRange = 'all_time' | 'today' | 'week' | 'month';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get('sortBy') as SortBy) || 'profit';
    const timeRange = (searchParams.get('timeRange') as TimeRange) || 'all_time';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let table = 'coin_flip_leaderboard';
    let orderColumn = 'net_profit';

    // Determine table based on time range
    switch (timeRange) {
      case 'today':
        table = 'coin_flip_leaderboard_daily';
        orderColumn = 'net_profit';
        break;
      case 'week':
        table = 'coin_flip_leaderboard_weekly';
        orderColumn = 'net_profit';
        break;
      case 'month':
        // TODO: Add monthly table or filter
        table = 'coin_flip_leaderboard';
        break;
      default:
        table = 'coin_flip_leaderboard';
    }

    // Determine order column based on sortBy
    switch (sortBy) {
      case 'profit':
        orderColumn = 'net_profit';
        break;
      case 'volume':
        orderColumn = 'total_wagered';
        break;
      case 'wins':
        orderColumn = 'total_wins';
        break;
      case 'streak':
        orderColumn = 'longest_streak';
        break;
      case 'win_rate':
        orderColumn = 'win_rate';
        break;
      case 'biggest_win':
        orderColumn = 'biggest_win';
        break;
      case 'best_cashout':
        orderColumn = 'best_cashout';
        break;
      case 'total_flips':
        orderColumn = 'total_flips';
        break;
    }

    // Build query
    let query = supabase
      .from(table)
      .select('*');

    // Add filters
    if (timeRange === 'today') {
      query = query.eq('date', new Date().toISOString().split('T')[0]);
    } else if (timeRange === 'week') {
      // Get Monday of current week
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      query = query.eq('week_start', monday.toISOString().split('T')[0]);
    }

    // For win_rate, require minimum flips
    if (sortBy === 'win_rate') {
      query = query.gte('total_flips', 50);
    }

    // Order and limit
    const { data, error } = await query
      .order(orderColumn, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      leaders: data || [],
      total: count || 0,
      sortBy,
      timeRange,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in /api/flip/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
