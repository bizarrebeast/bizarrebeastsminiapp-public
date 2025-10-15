import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractAuthHeaders, verifyCompleteAuth } from '@/lib/auth/verification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      fid: providedFid,
      txHash,
      streak,
      tier,
      rewardsEarned
    } = await request.json();

    if (!walletAddress || !txHash) {
      return NextResponse.json({
        error: 'Wallet address and transaction hash are required'
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
          console.log('Got FID from auth for recording:', userFid);
        }
      }
    }

    // If still no FID, check users table
    if (!userFid) {
      const { data: userData } = await supabase
        .from('users')
        .select('farcaster_fid')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (userData?.farcaster_fid) {
        userFid = userData.farcaster_fid;
      }
    }

    // Record the check-in
    const { data: checkInRecord, error: insertError } = await supabase
      .from('checkin_records')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        fid: userFid || null,
        checked_in_at: new Date().toISOString(),
        streak_at_checkin: streak || null,
        tier_at_checkin: tier || null,
        on_chain_tx_hash: txHash,
        rewards_earned: rewardsEarned || 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error recording check-in:', insertError);
      return NextResponse.json({
        error: 'Failed to record check-in',
        details: insertError.message
      }, { status: 500 });
    }

    // Update FID streak table if we have an FID
    if (userFid) {
      // Calculate new streak
      const { data: newStreak } = await supabase
        .rpc('calculate_fid_streak', { user_fid: userFid });

      // First check if FID streak record exists
      const { data: existingStreak } = await supabase
        .from('fid_streaks')
        .select('*')
        .eq('fid', userFid)
        .single();

      if (existingStreak) {
        // Update existing record
        const { error: streakError } = await supabase
          .from('fid_streaks')
          .update({
            current_streak: newStreak || 1,
            best_streak: Math.max(existingStreak.best_streak, newStreak || 1),
            last_checkin_at: new Date().toISOString(),
            total_checkins: existingStreak.total_checkins + 1,
            total_rewards_earned: existingStreak.total_rewards_earned + (rewardsEarned || 0),
            updated_at: new Date().toISOString()
          })
          .eq('fid', userFid);

        if (streakError) {
          console.error('Error updating FID streak:', streakError);
        }
      } else {
        // Insert new record
        const { error: streakError } = await supabase
          .from('fid_streaks')
          .insert({
            fid: userFid,
            current_streak: newStreak || 1,
            best_streak: newStreak || 1,
            last_checkin_at: new Date().toISOString(),
            total_checkins: 1,
            total_rewards_earned: rewardsEarned || 0,
            first_checkin_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (streakError) {
          console.error('Error inserting FID streak:', streakError);
        }
      }

      // Update best streak if needed
      const { data: streakData } = await supabase
        .from('fid_streaks')
        .select('current_streak, best_streak')
        .eq('fid', userFid)
        .single();

      if (streakData && streakData.current_streak > streakData.best_streak) {
        await supabase
          .from('fid_streaks')
          .update({ best_streak: streakData.current_streak })
          .eq('fid', userFid);
      }
    }

    return NextResponse.json({
      success: true,
      recordId: checkInRecord.id,
      fid: userFid,
      message: userFid
        ? `Check-in recorded for FID ${userFid}`
        : 'Check-in recorded (wallet-only mode)'
    });

  } catch (error) {
    console.error('Record check-in error:', error);
    return NextResponse.json({
      error: 'Failed to record check-in',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve check-in history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = supabase
      .from('checkin_records')
      .select('*')
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (fid) {
      query = query.eq('fid', parseInt(fid));
    } else if (wallet) {
      query = query.eq('wallet_address', wallet.toLowerCase());
    } else {
      return NextResponse.json({
        error: 'FID or wallet required'
      }, { status: 400 });
    }

    const { data: checkIns, error } = await query;

    if (error) {
      throw error;
    }

    // Get streak data if FID provided
    let streakInfo = null;
    if (fid) {
      const { data: streakData } = await supabase
        .from('fid_streaks')
        .select('*')
        .eq('fid', parseInt(fid))
        .single();

      streakInfo = streakData;
    }

    return NextResponse.json({
      checkIns: checkIns || [],
      streakInfo,
      totalRecords: checkIns?.length || 0
    });

  } catch (error) {
    console.error('Get check-in history error:', error);
    return NextResponse.json({
      error: 'Failed to get check-in history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}