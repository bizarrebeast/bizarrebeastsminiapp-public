import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ritualId, ritualTitle, completed, timeToComplete } = body;

    if (!userId || !ritualId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert ritual completion record
    const { data, error } = await supabase
      .from('ritual_completions')
      .insert({
        user_id: userId,
        ritual_id: ritualId,
        ritual_title: ritualTitle,
        completed,
        time_to_complete: timeToComplete,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to track ritual:', error);
      return NextResponse.json({ error: 'Failed to track ritual' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Track ritual error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    const startDate = new Date();
    if (timeRange === '24h') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch ritual completions
    const { data: completions, error } = await supabase
      .from('ritual_completions')
      .select(`
        *,
        unified_users!inner(farcaster_username, wallet_address)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch ritual data:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate data by ritual
    const ritualStats: Record<number, any> = {};
    const userStats: Record<string, any> = {};
    const hourlyActivity: Record<number, number> = {};

    // Initialize hourly buckets
    for (let i = 0; i < 24; i++) {
      hourlyActivity[i] = 0;
    }

    completions?.forEach(completion => {
      // Ritual stats
      if (!ritualStats[completion.ritual_id]) {
        ritualStats[completion.ritual_id] = {
          id: completion.ritual_id,
          title: completion.ritual_title,
          completions: 0,
          totalTime: 0,
          users: new Set()
        };
      }
      ritualStats[completion.ritual_id].completions++;
      ritualStats[completion.ritual_id].totalTime += completion.time_to_complete || 0;
      ritualStats[completion.ritual_id].users.add(completion.user_id);

      // User stats
      const username = completion.unified_users?.farcaster_username || 'Anonymous';
      if (!userStats[username]) {
        userStats[username] = {
          username,
          completedCount: 0,
          lastCompleted: completion.created_at
        };
      }
      userStats[username].completedCount++;

      // Hourly activity
      const hour = new Date(completion.created_at).getHours();
      hourlyActivity[hour]++;
    });

    // Format ritual stats
    const formattedRitualStats = Object.values(ritualStats).map(ritual => ({
      id: ritual.id,
      title: ritual.title,
      completions: ritual.completions,
      uniqueUsers: ritual.users.size,
      avgTimeToComplete: ritual.completions > 0 ? Math.floor(ritual.totalTime / ritual.completions) : 0
    }));

    // Get top performers
    const topPerformers = Object.values(userStats)
      .sort((a: any, b: any) => b.completedCount - a.completedCount)
      .slice(0, 10);

    return NextResponse.json({
      ritualStats: formattedRitualStats,
      topPerformers,
      hourlyActivity,
      totalCompletions: completions?.length || 0,
      uniqueUsers: new Set(completions?.map(c => c.user_id)).size
    });
  } catch (error) {
    console.error('Get ritual analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}