import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!validateAdminAccess(walletAddress)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

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

    // Get all contests
    const { data, error } = await supabaseAdmin
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all contests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contests: data || []
    });

  } catch (error) {
    console.error('Error in contests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
