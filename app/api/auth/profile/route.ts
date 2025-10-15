import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface UnifiedProfile {
  id: string;
  // Wallet data
  walletAddress: string | null;
  walletEns: string | null;
  // Farcaster data
  farcasterFid: number | null;
  farcasterUsername: string | null;
  farcasterDisplayName: string | null;
  farcasterPfpUrl: string | null;
  farcasterBio: string | null;
  verifiedAddresses: string[];
  // Empire data
  empireTier: string | null;
  empireRank: number | null;
  empireScore: string | null;
  // Metadata
  primaryIdentity: 'wallet' | 'farcaster' | null;
  identitiesLinked: boolean;
  linkedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  preferences: any;
  metadata: any;
}

/**
 * Calculate tier based on Empire rank
 */
function getTierFromRank(rank: number | null): string | null {
  if (!rank) return null;
  if (rank <= 25) return 'BIZARRE';  // Fixed: was 10, should be 25
  if (rank <= 50) return 'WEIRDO';
  if (rank <= 100) return 'ODDBALL'; // Fixed: was 150, should be 100
  if (rank <= 500) return 'MISFIT';
  return 'NORMIE';
}

/**
 * Fetch Empire protocol data for a wallet address with timeout and retry
 */
async function fetchEmpireData(walletAddress: string, retries: number = 2) {
  const timeout = 5000; // 5 second timeout
  const BB_TOKEN_ADDRESS = '0x0520bf1d3cEE163407aDA79109333aB1599b4004';
  const EMPIRE_API_BASE = 'https://www.empirebuilder.world/api';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Fetch the leaderboard to find this wallet's rank
      const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Find the wallet in the leaderboard (case-insensitive)
        const holder = data.holders?.find((h: any) =>
          h.address?.toLowerCase() === walletAddress.toLowerCase()
        );

        if (holder) {
          const rank = holder.rank || null;
          const tier = getTierFromRank(rank);
          const score = holder.balance || holder.baseBalance || null;

          console.log(`Empire data for ${walletAddress}: rank=${rank}, tier=${tier}`);
          return { tier, rank, score };
        }

        // Wallet not found in leaderboard
        console.log(`Wallet ${walletAddress} not found in Empire leaderboard`);
        return { tier: null, rank: null, score: null };
      }

      // If not ok but not a network error, don't retry
      if (response.status >= 400 && response.status < 500) {
        console.warn(`Empire API returned ${response.status} for leaderboard`);
        break;
      }
    } catch (error: any) {
      // Log the error but continue
      if (error.name === 'AbortError') {
        console.warn(`Empire API timeout (attempt ${attempt + 1}/${retries + 1})`);
      } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
        console.warn(`Empire API DNS resolution failed (attempt ${attempt + 1}/${retries + 1})`);
      } else {
        console.warn(`Empire API error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      }

      // If this was the last attempt, break
      if (attempt === retries) {
        console.error('Empire API failed after all retries:', error.message);
        break;
      }

      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  // Return null values if all attempts failed
  return { tier: null, rank: null, score: null };
}

/**
 * Fetch additional Farcaster data from Neynar API
 */
async function fetchFarcasterData(fid: number) {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by-fid?fid=${fid}`,
      {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
  } catch (error) {
    console.error('Failed to fetch Farcaster data:', error);
  }
  return null;
}

/**
 * GET /api/auth/profile
 * Fetch unified user profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const farcasterFid = searchParams.get('farcasterFid');
    const userId = searchParams.get('userId');
    const refreshData = searchParams.get('refresh') === 'true';

    // Validate that at least one identifier is provided
    if (!walletAddress && !farcasterFid && !userId) {
      return NextResponse.json(
        { error: 'Either walletAddress, farcasterFid, or userId is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase.from('unified_users').select('*');

    if (userId) {
      query = query.eq('id', userId);
    } else if (walletAddress && farcasterFid) {
      // Try to find user with either identifier
      query = query.or(`wallet_address.eq.${walletAddress},farcaster_fid.eq.${farcasterFid}`);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    } else if (farcasterFid) {
      query = query.eq('farcaster_fid', parseInt(farcasterFid));
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: error },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle multiple users (should not happen with proper constraints)
    if (users.length > 1) {
      console.warn('Multiple users found for query:', { walletAddress, farcasterFid, userId });
    }

    const user = users[0];

    // Optionally refresh external data
    let empireData = {
      tier: user.empire_tier,
      rank: user.empire_rank,
      score: user.empire_score
    };

    let farcasterData = null;

    if (refreshData) {
      // Refresh Empire data if wallet is connected
      if (user.wallet_address) {
        empireData = await fetchEmpireData(user.wallet_address);

        // Update database with fresh Empire data
        await supabase
          .from('unified_users')
          .update({
            empire_tier: empireData.tier,
            empire_rank: empireData.rank,
            empire_score: empireData.score,
            empire_data_updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      // Refresh Farcaster data if FID exists
      if (user.farcaster_fid) {
        farcasterData = await fetchFarcasterData(user.farcaster_fid);

        if (farcasterData) {
          // Update database with fresh Farcaster data
          await supabase
            .from('unified_users')
            .update({
              farcaster_username: farcasterData.username,
              farcaster_display_name: farcasterData.display_name,
              farcaster_pfp_url: farcasterData.pfp_url,
              farcaster_bio: farcasterData.bio,
              verified_addresses: farcasterData.verified_addresses || []
            })
            .eq('id', user.id);
        }
      }
    }

    // Build unified profile response
    const profile: UnifiedProfile = {
      id: user.id,
      // Wallet data
      walletAddress: user.wallet_address,
      walletEns: user.wallet_ens,
      // Farcaster data
      farcasterFid: user.farcaster_fid,
      farcasterUsername: user.farcaster_username,
      farcasterDisplayName: user.farcaster_display_name,
      farcasterPfpUrl: user.farcaster_pfp_url,
      farcasterBio: user.farcaster_bio,
      verifiedAddresses: user.verified_addresses || [],
      // Empire data
      empireTier: empireData.tier,
      empireRank: empireData.rank,
      empireScore: empireData.score,
      // Metadata
      primaryIdentity: user.primary_identity,
      identitiesLinked: user.identities_linked || false,
      linkedAt: user.linked_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
      preferences: user.preferences || {},
      metadata: user.metadata || {}
    };

    // Update last login
    await supabase
      .from('unified_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      profile,
      dataRefreshed: refreshData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/profile
 * Update user profile preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences, primaryIdentity } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (primaryIdentity) {
      if (!['wallet', 'farcaster'].includes(primaryIdentity)) {
        return NextResponse.json(
          { error: 'Invalid primary identity. Must be "wallet" or "farcaster"' },
          { status: 400 }
        );
      }
      updateData.primary_identity = primaryIdentity;
    }

    const { data: updatedUser, error } = await supabase
      .from('unified_users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/profile
 * Unlink identities or delete user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unlinkOnly = searchParams.get('unlinkOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (unlinkOnly) {
      // Just unlink identities, don't delete
      const { data: updatedUser, error } = await supabase
        .from('unified_users')
        .update({
          identities_linked: false,
          linked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to unlink identities', details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Identities unlinked successfully',
        user: updatedUser
      });
    } else {
      // Delete user and all associated data
      const { error } = await supabase
        .from('unified_users')
        .delete()
        .eq('id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete user', details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });
    }

  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}