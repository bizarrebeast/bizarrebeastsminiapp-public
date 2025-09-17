import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { contestId, walletAddress } = await request.json();

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID is required' },
        { status: 400 }
      );
    }

    // Get contest to check if tracking is enabled
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('track_cta_clicks')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Only track if enabled
    if (contest.track_cta_clicks) {
      // Get IP address and user agent
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Insert click record
      const { error: insertError } = await supabase
        .from('contest_cta_clicks')
        .insert({
          contest_id: contestId,
          wallet_address: walletAddress || null,
          ip_address: ip.split(',')[0].trim(), // Get first IP if multiple
          user_agent: userAgent
        });

      if (insertError) {
        console.error('Error tracking CTA click:', insertError);
        // Don't fail the request if tracking fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-cta route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}