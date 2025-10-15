import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // First update expired contests
    const now = new Date().toISOString();
    const { data: expiredContests } = await supabaseAdmin
      .from('contests')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', now);

    if (expiredContests && expiredContests.length > 0) {
      const contestIds = expiredContests.map(c => c.id);
      await supabaseAdmin
        .from('contests')
        .update({ status: 'ended' })
        .in('id', contestIds);
    }

    // Get active, upcoming, and ended contests
    const [activeData, upcomingData, endedData] = await Promise.all([
      supabaseAdmin
        .from('active_contests_view')
        .select('*')
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('contests')
        .select('*')
        .eq('status', 'active')
        .gt('start_date', now)
        .order('start_date', { ascending: true }),

      supabaseAdmin
        .from('contests')
        .select('*')
        .eq('status', 'ended')
        .order('end_date', { ascending: false })
        .limit(5)
    ]);

    return NextResponse.json({
      success: true,
      active: activeData.data || [],
      upcoming: upcomingData.data || [],
      ended: endedData.data || []
    });

  } catch (error) {
    console.error('Error in active contests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
