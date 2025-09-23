import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchUserCastsForRitual } from '@/lib/neynar';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Point values for share types
const SHARE_POINTS = {
  ritual: { base: 10, verified: 20 },
  contest: { base: 15, verified: 30 },
  contest_entry: { base: 15, verified: 30 },
  contest_position: { base: 25, verified: 50 },
  contest_winner: { base: 50, verified: 100 },
  rank: { base: 5, verified: 10 },
  checkin: { base: 5, verified: 15 },
  claim: { base: 10, verified: 20 },
  milestone: { base: 20, verified: 40 },
  meme: { base: 5, verified: 10 },
  default: { base: 5, verified: 10 }
};

interface VerifyShareRequest {
  shareId: string;
  platform: 'farcaster' | 'twitter' | 'telegram';
  verificationData?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyShareRequest = await request.json();

    if (!body.shareId || !body.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: shareId and platform' },
        { status: 400 }
      );
    }

    // Get share details
    const { data: share, error: shareError } = await supabase
      .from('user_shares')
      .select('*, user:unified_users(*)')
      .eq('id', body.shareId)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (share.verified) {
      return NextResponse.json({
        success: true,
        message: 'Share already verified',
        verified: true,
        pointsAwarded: share.points_awarded
      });
    }

    // Platform-specific verification
    let verified = false;
    let verificationResult: any = {};

    switch (body.platform) {
      case 'farcaster':
        // Verify Farcaster share using Neynar
        // For rituals, use verification logic
        if (share.share_type === 'ritual' && share.content_id) {
          // If user has FID, use Neynar verification
          if (share.user?.farcaster_fid) {
            verificationResult = await searchUserCastsForRitual(
              share.user.farcaster_fid,
              parseInt(share.content_id)
            );
            verified = verificationResult.verified || false;
          } else {
            // For users without FID (wallet-only users), auto-verify recent shares
            // This allows wallet users to complete rituals while we work on FID integration
            const shareAge = Date.now() - new Date(share.created_at).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            verified = shareAge < fiveMinutes;
            verificationResult = {
              autoVerified: true,
              reason: 'Recent share (wallet user)',
              note: 'User does not have Farcaster FID for full verification'
            };
          }
        } else {
          // For other types, check if cast was made recently (within 5 minutes)
          const shareAge = Date.now() - new Date(share.created_at).getTime();
          const fiveMinutes = 5 * 60 * 1000;
          verified = shareAge < fiveMinutes; // Auto-verify if shared within 5 minutes
          verificationResult = { autoVerified: true, reason: 'Recent share' };
        }
        break;

      case 'twitter':
        // Twitter verification would require Twitter API v2
        // For now, manual verification or OAuth flow
        if (body.verificationData?.tweetId) {
          // Store tweet ID for manual verification
          verificationResult = { tweetId: body.verificationData.tweetId };
          verified = false; // Requires manual verification
        }
        break;

      case 'telegram':
        // Telegram shares within miniapp can be auto-verified
        if (body.verificationData?.miniapp) {
          verified = true;
          verificationResult = { source: 'telegram_miniapp', autoVerified: true };
        }
        break;

      default:
        return NextResponse.json(
          { error: `Verification not supported for platform: ${body.platform}` },
          { status: 400 }
        );
    }

    // Update share with verification status
    const { error: updateError } = await supabase
      .from('user_shares')
      .update({
        verified,
        verified_at: verified ? new Date().toISOString() : null,
        verification_data: verificationResult
      })
      .eq('id', body.shareId);

    if (updateError) {
      console.error('Update share error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update share verification' },
        { status: 500 }
      );
    }

    // Award points if verified
    let pointsAwarded = 0;
    if (verified) {
      const pointConfig = SHARE_POINTS[share.share_type as keyof typeof SHARE_POINTS] || SHARE_POINTS.default;

      // Call the award_share_points function
      const { data: points, error: pointsError } = await supabase
        .rpc('award_share_points', {
          p_share_id: body.shareId,
          p_base_points: pointConfig.base,
          p_verified_bonus: pointConfig.verified
        });

      if (!pointsError && points) {
        pointsAwarded = points;
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      pointsAwarded,
      verificationResult,
      message: verified ? 'Share verified successfully' : 'Share recorded but not verified'
    });

  } catch (error) {
    console.error('Verify share error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'shareId parameter required' },
        { status: 400 }
      );
    }

    const { data: share, error } = await supabase
      .from('user_shares')
      .select('id, verified, verified_at, points_awarded, verification_data')
      .eq('id', shareId)
      .single();

    if (error || !share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      shareId: share.id,
      verified: share.verified,
      verifiedAt: share.verified_at,
      pointsAwarded: share.points_awarded,
      verificationData: share.verification_data
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}