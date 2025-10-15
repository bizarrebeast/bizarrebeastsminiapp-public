import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check-in unlock configuration
const CHECKIN_UNLOCK_CONFIG = {
  // Starting configuration - 3 shares required as per user request
  SHARES_REQUIRED: 3,
  // Quality score requirements by tier
  QUALITY_THRESHOLDS: {
    BIZARRE: 0.3,   // Lower requirement for BIZARRE tier users
    EXOTIC: 0.4,    // Medium requirement
    WEIRDO: 0.5,    // Higher requirement
    MISFIT: 0.6,    // Highest requirement for MISFIT
    NORMIE: 0.5     // Default
  },
  // Bonus multipliers for share quality
  QUALITY_MULTIPLIERS: {
    verified: 1.5,      // Verified shares count 1.5x
    multi_platform: 1.3, // Shares across different platforms
    has_image: 1.2,     // Shares with images
    custom_text: 1.1    // Customized share text
  }
};

// Contract configuration for unlocking
const GATEKEEPER_ABI = [
  "function unlockCheckInViaShare(address user, bytes32 shareHash) external",
  "function canUserCheckIn(address user) external view returns (bool)",
  "function setAuthorizedAddress(address) external"
];

const GATEKEEPER_ADDRESS = "0x0f57b7755A1CBa924fC23d6b40153668245DBd1a";
const PRIVATE_KEY = process.env.RITUAL_ADMIN_PRIVATE_KEY;

interface UnlockRequest {
  userId?: string;
  walletAddress?: string;
  farcasterFid?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: UnlockRequest = await request.json();

    // Get user ID from various sources
    let userId = body.userId;
    let walletAddress = body.walletAddress;

    if (!userId) {
      if (body.walletAddress || body.farcasterFid) {
        let query = supabase.from('unified_users').select('id, wallet_address, empire_tier');

        if (body.walletAddress) {
          query = query.eq('wallet_address', body.walletAddress);
        } else if (body.farcasterFid) {
          query = query.eq('farcaster_fid', body.farcasterFid);
        }

        const { data: userData, error: userError } = await query.single();

        if (userData) {
          userId = userData.id;
          walletAddress = walletAddress || userData.wallet_address;
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

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required for check-in unlock' },
        { status: 400 }
      );
    }

    // Check if already unlocked via smart contract
    if (PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const gatekeeper = new ethers.Contract(GATEKEEPER_ADDRESS, GATEKEEPER_ABI, provider);

      const isUnlocked = await gatekeeper.canUserCheckIn(walletAddress);
      if (isUnlocked) {
        return NextResponse.json({
          success: true,
          message: 'Check-in already unlocked',
          alreadyUnlocked: true
        });
      }
    }

    // Get user's verified RITUAL shares (not contests, checkins, etc.)
    const { data: shares, error: sharesError } = await supabase
      .from('user_shares')
      .select('*')
      .eq('user_id', userId)
      .eq('verified', true)
      .eq('share_type', 'ritual')  // ONLY ritual shares count
      .order('created_at', { ascending: false });

    if (sharesError) {
      console.error('Error fetching user shares:', sharesError);
      return NextResponse.json(
        { error: 'Failed to fetch user shares' },
        { status: 500 }
      );
    }

    // Calculate share quality and count
    let qualifiedShares = 0;
    let totalQualityScore = 0;
    const platformsUsed = new Set();
    const shareAnalysis = [];

    for (const share of shares || []) {
      let shareQualityScore = 0.5; // Base score for verified shares

      // Platform bonuses
      if (share.share_platform === 'farcaster') shareQualityScore += 0.2;
      if (share.share_platform === 'twitter') shareQualityScore += 0.15;

      // Content bonuses
      if (share.content_data?.hasImage) shareQualityScore *= CHECKIN_UNLOCK_CONFIG.QUALITY_MULTIPLIERS.has_image;
      if (share.share_text && share.share_text.length > 50) shareQualityScore *= CHECKIN_UNLOCK_CONFIG.QUALITY_MULTIPLIERS.custom_text;

      // Multi-platform bonus
      platformsUsed.add(share.share_platform);
      if (platformsUsed.size > 1) shareQualityScore *= CHECKIN_UNLOCK_CONFIG.QUALITY_MULTIPLIERS.multi_platform;

      shareAnalysis.push({
        id: share.id,
        platform: share.share_platform,
        type: share.share_type,
        qualityScore: shareQualityScore,
        createdAt: share.created_at
      });

      totalQualityScore += shareQualityScore;

      // Count as qualified if above minimum threshold
      if (shareQualityScore >= 0.4) {
        qualifiedShares++;
      }
    }

    const avgQualityScore = shares?.length ? totalQualityScore / shares.length : 0;

    // Check if user meets requirements
    const sharesRequired = CHECKIN_UNLOCK_CONFIG.SHARES_REQUIRED;
    const qualityThreshold = 0.5; // Default threshold

    const meetsRequirements = qualifiedShares >= sharesRequired && avgQualityScore >= qualityThreshold;

    if (!meetsRequirements) {
      return NextResponse.json({
        success: false,
        meetsRequirements: false,
        currentShares: qualifiedShares,
        sharesRequired,
        avgQualityScore,
        qualityThreshold,
        message: `Need ${sharesRequired - qualifiedShares} more qualified shares to unlock check-ins`,
        shareAnalysis
      }, { status: 400 });
    }

    // Unlock check-in on blockchain if requirements met
    if (PRIVATE_KEY && meetsRequirements) {
      try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const gatekeeper = new ethers.Contract(GATEKEEPER_ADDRESS, GATEKEEPER_ABI, wallet);

        // Create a hash from the user's best shares
        const bestShares = shareAnalysis
          .sort((a, b) => b.qualityScore - a.qualityScore)
          .slice(0, sharesRequired);

        const shareHash = ethers.keccak256(
          ethers.toUtf8Bytes(bestShares.map(s => s.id).join(','))
        );

        console.log(`Unlocking check-in via shares for ${walletAddress} with hash ${shareHash}`);
        const tx = await gatekeeper.unlockCheckInViaShare(walletAddress, shareHash);
        const receipt = await tx.wait();

        // Record the unlock in our database
        await supabase
          .from('user_shares')
          .update({ unlocked_checkin: true })
          .in('id', bestShares.map(s => s.id));

        return NextResponse.json({
          success: true,
          message: 'Check-in unlocked successfully via shares',
          transactionHash: receipt.hash,
          sharesUsed: bestShares,
          qualifiedShares,
          avgQualityScore,
          alreadyUnlocked: false
        });

      } catch (contractError: any) {
        console.error('Smart contract unlock error:', contractError);

        // Even if blockchain fails, record the qualification
        await supabase
          .from('user_shares')
          .update({ unlocked_checkin: true })
          .eq('user_id', userId)
          .eq('verified', true);

        return NextResponse.json({
          success: true,
          message: 'Shares qualify for check-in unlock (blockchain transaction failed but recorded)',
          qualifiedShares,
          avgQualityScore,
          contractError: contractError.message,
          alreadyUnlocked: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shares qualify for check-in unlock',
      qualifiedShares,
      avgQualityScore,
      shareAnalysis,
      alreadyUnlocked: false
    });

  } catch (error: any) {
    console.error('Share-based unlock error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process share-based unlock',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check share-based unlock status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('wallet');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'userId or wallet parameter required' },
        { status: 400 }
      );
    }

    let query = supabase.from('user_shares').select('*').eq('verified', true).eq('share_type', 'ritual');

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Find user by wallet address first
      const { data: userData } = await supabase
        .from('unified_users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (!userData) {
        return NextResponse.json({
          qualifiedShares: 0,
          sharesRequired: CHECKIN_UNLOCK_CONFIG.SHARES_REQUIRED,
          meetsRequirements: false,
          message: '3 verified ritual shares required for check-in unlock'
        });
      }

      query = query.eq('user_id', userData.id);
    }

    const { data: shares } = await query;

    // Calculate qualification status
    const qualifiedShares = shares?.filter(share => {
      let qualityScore = 0.5;
      if (share.share_platform === 'farcaster') qualityScore += 0.2;
      if (share.share_platform === 'twitter') qualityScore += 0.15;
      return qualityScore >= 0.4;
    }).length || 0;

    const meetsRequirements = qualifiedShares >= CHECKIN_UNLOCK_CONFIG.SHARES_REQUIRED;

    return NextResponse.json({
      qualifiedShares,
      sharesRequired: CHECKIN_UNLOCK_CONFIG.SHARES_REQUIRED,
      totalShares: shares?.length || 0,
      meetsRequirements,
      message: meetsRequirements
        ? 'Qualified for check-in unlock via shares'
        : `Need ${CHECKIN_UNLOCK_CONFIG.SHARES_REQUIRED - qualifiedShares} more qualified shares`
    });

  } catch (error: any) {
    console.error('Check share status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check share status',
        details: error.message
      },
      { status: 500 }
    );
  }
}