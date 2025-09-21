import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Share cooldown configuration (in minutes)
const SHARE_COOLDOWNS: Record<string, number> = {
  ritual: 60,        // 1 hour
  contest: 0,        // No cooldown (per entry)
  rank: 1440,        // 24 hours
  checkin: 1440,     // 24 hours (daily)
  milestone: 0,      // No cooldown (one-time)
  contest_winner: 0, // No cooldown (per win)
  meme: 30,          // 30 minutes
  default: 60        // 1 hour default
};

interface TrackShareRequest {
  userId?: string;
  shareType: string;
  sharePlatform: string;
  contentId?: string;
  contentData?: any;
  shareUrl?: string;
  shareText?: string;
  walletAddress?: string;
  farcasterFid?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackShareRequest = await request.json();

    // Validate required fields
    if (!body.shareType || !body.sharePlatform) {
      return NextResponse.json(
        { error: 'Missing required fields: shareType and sharePlatform' },
        { status: 400 }
      );
    }

    // Get user ID from various sources
    let userId = body.userId;

    if (!userId) {
      // Try to find user by wallet or Farcaster ID
      if (body.walletAddress || body.farcasterFid) {
        let query = supabase.from('unified_users').select('id');

        if (body.walletAddress) {
          query = query.eq('wallet_address', body.walletAddress);
        } else if (body.farcasterFid) {
          query = query.eq('farcaster_fid', body.farcasterFid);
        }

        const { data: userData, error: userError } = await query.single();

        if (userData) {
          userId = userData.id;
        } else {
          return NextResponse.json(
            { error: 'User not found. Please connect with wallet or Farcaster first.' },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'User identification required (userId, walletAddress, or farcasterFid)' },
          { status: 400 }
        );
      }
    }

    // Check cooldown for this share type
    const cooldownMinutes = SHARE_COOLDOWNS[body.shareType] || SHARE_COOLDOWNS.default;

    if (cooldownMinutes > 0) {
      // Call the check_share_cooldown function
      const { data: canShare, error: cooldownError } = await supabase
        .rpc('check_share_cooldown', {
          p_user_id: userId,
          p_share_type: body.shareType,
          p_content_id: body.contentId || null,
          p_cooldown_minutes: cooldownMinutes
        });

      if (cooldownError) {
        console.error('Cooldown check error:', cooldownError);
      } else if (!canShare) {
        return NextResponse.json(
          {
            error: 'Share cooldown active',
            cooldownMinutes,
            message: `You can share this type of content again in ${cooldownMinutes} minutes`
          },
          { status: 429 }
        );
      }
    }

    // Track the share
    const { data: shareData, error: shareError } = await supabase
      .from('user_shares')
      .insert([{
        user_id: userId,
        share_type: body.shareType,
        share_platform: body.sharePlatform,
        content_id: body.contentId,
        content_data: body.contentData || {},
        share_url: body.shareUrl,
        share_text: body.shareText,
        verified: false // Will be verified separately
      }])
      .select()
      .single();

    if (shareError) {
      console.error('Share tracking error:', shareError);
      return NextResponse.json(
        { error: 'Failed to track share', details: shareError },
        { status: 500 }
      );
    }

    // Return success with share ID for verification
    return NextResponse.json({
      success: true,
      shareId: shareData.id,
      message: 'Share tracked successfully',
      requiresVerification: true,
      verificationEndpoint: '/api/shares/verify'
    });

  } catch (error) {
    console.error('Track share error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's share history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const shareType = searchParams.get('shareType');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('user_shares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (shareType) {
      query = query.eq('share_type', shareType);
    }

    const { data: shares, error } = await query;

    if (error) {
      console.error('Fetch shares error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shares', details: error },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      totalShares: shares.length,
      verifiedShares: shares.filter(s => s.verified).length,
      pointsEarned: shares.reduce((sum, s) => sum + (s.points_awarded || 0), 0),
      sharesByType: shares.reduce((acc, s) => {
        acc[s.share_type] = (acc[s.share_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      sharesByPlatform: shares.reduce((acc, s) => {
        acc[s.share_platform] = (acc[s.share_platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      shares,
      stats
    });

  } catch (error) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}