import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractAuthHeaders, verifyCompleteAuth } from '@/lib/auth/verification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, fid: providedFid } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({
        error: 'Wallet address is required'
      }, { status: 400 });
    }

    // Try to get FID from multiple sources
    let userFid = providedFid;

    // If no FID provided, try to get from auth headers
    if (!userFid) {
      const { authToken } = extractAuthHeaders(request);
      if (authToken) {
        const verification = await verifyCompleteAuth(authToken, null);
        if (verification.success && verification.user?.fid) {
          userFid = verification.user.fid;
          console.log('Got FID from auth:', userFid);
        }
      }
    }

    // If still no FID, check if wallet has associated FID in users table
    if (!userFid) {
      const { data: userData } = await supabase
        .from('users')
        .select('farcaster_fid')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (userData?.farcaster_fid) {
        userFid = userData.farcaster_fid;
        console.log('Got FID from users table:', userFid);
      }
    }

    // If no FID found, allow check-in (wallet-only user)
    if (!userFid) {
      console.log('No FID found for wallet, allowing check-in (wallet-only mode)');
      return NextResponse.json({
        allowed: true,
        reason: 'wallet-only',
        message: 'No Farcaster account linked - using wallet-based tracking'
      });
    }

    // Check if FID can check in using database function
    const { data: canCheckIn, error: checkError } = await supabase
      .rpc('can_fid_checkin', { user_fid: userFid });

    if (checkError) {
      console.error('Error checking FID cooldown:', checkError);
      // On error, be permissive to avoid blocking users
      return NextResponse.json({
        allowed: true,
        reason: 'check-error',
        error: checkError.message
      });
    }

    // Get last check-in details if exists
    const { data: lastCheckIn } = await supabase
      .rpc('get_fid_last_checkin', { user_fid: userFid });

    if (!canCheckIn && lastCheckIn && lastCheckIn.length > 0) {
      const last = lastCheckIn[0];
      const hoursRemaining = Math.max(0, 20 - last.hours_ago);

      return NextResponse.json({
        allowed: false,
        reason: 'cooldown',
        lastCheckIn: {
          wallet: last.wallet_address,
          timestamp: last.checked_in_at,
          hoursAgo: Math.round(last.hours_ago * 10) / 10
        },
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        message: `Already checked in ${Math.round(last.hours_ago)} hours ago via wallet ${last.wallet_address.slice(0, 6)}...${last.wallet_address.slice(-4)}`
      });
    }

    // FID can check in
    return NextResponse.json({
      allowed: true,
      reason: 'ready',
      fid: userFid,
      message: 'Ready to check in'
    });

  } catch (error) {
    console.error('FID validation error:', error);
    // On error, be permissive to avoid blocking users
    return NextResponse.json({
      allowed: true,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const wallet = searchParams.get('wallet');

    if (!fid && !wallet) {
      return NextResponse.json({
        error: 'FID or wallet required'
      }, { status: 400 });
    }

    let userFid = fid ? parseInt(fid) : null;

    // If only wallet provided, look up FID
    if (!userFid && wallet) {
      const { data: userData } = await supabase
        .from('users')
        .select('farcaster_fid')
        .eq('wallet_address', wallet.toLowerCase())
        .single();

      if (userData?.farcaster_fid) {
        userFid = userData.farcaster_fid;
      }
    }

    if (!userFid) {
      return NextResponse.json({
        status: 'no-fid',
        message: 'No Farcaster account linked to this wallet'
      });
    }

    // Get check-in history
    const { data: checkIns } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('fid', userFid)
      .order('checked_in_at', { ascending: false })
      .limit(30);

    // Get current streak
    const { data: streakData } = await supabase
      .rpc('calculate_fid_streak', { user_fid: userFid });

    // Check if can check in now
    const { data: canCheckIn } = await supabase
      .rpc('can_fid_checkin', { user_fid: userFid });

    return NextResponse.json({
      fid: userFid,
      canCheckIn,
      currentStreak: streakData || 0,
      totalCheckIns: checkIns?.length || 0,
      recentCheckIns: checkIns?.slice(0, 5).map(c => ({
        wallet: c.wallet_address,
        date: c.checked_in_at,
        tier: c.tier_at_checkin,
        streak: c.streak_at_checkin
      })) || []
    });

  } catch (error) {
    console.error('FID status check error:', error);
    return NextResponse.json({
      error: 'Failed to check FID status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}