import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/auth/link
 * Links a wallet address with a Farcaster identity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      farcasterFid,
      signature,
      message,
      farcasterData,
      skipRefresh
    } = body;

    // Validate required fields - either wallet or Farcaster required
    if (!walletAddress && !farcasterFid) {
      return NextResponse.json(
        { error: 'Either wallet address or Farcaster ID is required' },
        { status: 400 }
      );
    }

    // Verify wallet ownership through signature
    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          return NextResponse.json(
            { error: 'Invalid signature - wallet ownership verification failed' },
            { status: 401 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    }

    // Check if wallet address is already linked to another user (if wallet provided)
    let existingWalletUser = null;
    if (walletAddress) {
      const { data, error } = await supabase
        .from('unified_users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      existingWalletUser = data;
    }

    // Check if Farcaster FID is already linked to another user
    let existingFarcasterUser = null;
    if (farcasterFid) {
      const { data, error } = await supabase
        .from('unified_users')
        .select('*')
        .eq('farcaster_fid', farcasterFid)
        .single();
      existingFarcasterUser = data;
    }

    // Handle different linking scenarios
    if (existingWalletUser && existingFarcasterUser) {
      // Both identities exist but in different records - potential conflict
      if (existingWalletUser.id !== existingFarcasterUser.id) {
        // Return success with the Farcaster user data (prioritize Farcaster for single login)
        return NextResponse.json({
          success: true,
          message: 'Using existing Farcaster account',
          user: existingFarcasterUser,
          conflict: true,
          note: 'Different wallet previously linked, using Farcaster identity'
        });
      }

      // Both point to the same user - already linked
      return NextResponse.json({
        success: true,
        message: 'Identities already linked',
        user: existingWalletUser,
        alreadyLinked: true
      });
    }

    let userId: string;
    let updateData: any = {};

    if (existingWalletUser) {
      // User exists with wallet, add Farcaster identity
      userId = existingWalletUser.id;

      if (farcasterFid && farcasterData) {
        updateData = {
          farcaster_fid: farcasterFid,
          farcaster_username: farcasterData.username,
          farcaster_display_name: farcasterData.displayName,
          farcaster_pfp_url: farcasterData.pfpUrl,
          farcaster_bio: farcasterData.bio,
          verified_addresses: farcasterData.verifiedAddresses || [],
          identities_linked: true,
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    } else if (existingFarcasterUser) {
      // User exists with Farcaster, add wallet identity
      userId = existingFarcasterUser.id;

      updateData = {
        wallet_address: walletAddress,
        identities_linked: true,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      // Create new unified user
      const insertData: any = {
        primary_identity: farcasterFid ? 'farcaster' : 'wallet',
        created_at: new Date().toISOString()
      };

      // Add wallet if provided
      if (walletAddress) {
        insertData.wallet_address = walletAddress;
      }

      // Add Farcaster data if provided
      if (farcasterFid && farcasterData) {
        insertData.farcaster_fid = farcasterFid;
        insertData.farcaster_username = farcasterData.username;
        insertData.farcaster_display_name = farcasterData.displayName;
        insertData.farcaster_pfp_url = farcasterData.pfpUrl;
        insertData.farcaster_bio = farcasterData.bio;
        insertData.verified_addresses = farcasterData.verifiedAddresses || [];

        // Mark as linked only if both wallet and Farcaster are present
        if (walletAddress) {
          insertData.identities_linked = true;
          insertData.linked_at = new Date().toISOString();
        }
      }

      const { data: newUser, error: insertError } = await supabase
        .from('unified_users')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user', details: insertError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'New unified user created',
        user: newUser,
        isNewUser: true
      });
    }

    // Update existing user with new identity
    const { data: updatedUser, error: updateError } = await supabase
      .from('unified_users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to link identities', details: updateError },
        { status: 500 }
      );
    }

    // Only check auto-linking if we have both wallet and verified addresses
    if (updatedUser && updatedUser.verified_addresses && updatedUser.wallet_address) {
      const isVerified = updatedUser.verified_addresses.includes(updatedUser.wallet_address);

      if (isVerified && !updatedUser.identities_linked) {
        // Auto-link verified addresses
        const { data: autoLinkedUser, error: autoLinkError } = await supabase
          .from('unified_users')
          .update({
            identities_linked: true,
            linked_at: new Date().toISOString(),
            metadata: {
              ...updatedUser.metadata,
              auto_linked: true,
              auto_linked_at: new Date().toISOString()
            }
          })
          .eq('id', userId)
          .select()
          .single();

        if (!autoLinkError) {
          return NextResponse.json({
            success: true,
            message: 'Identities linked and verified automatically',
            user: autoLinkedUser,
            autoLinked: true
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Identities linked successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Link identities error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/link
 * Check link status for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const farcasterFid = searchParams.get('farcasterFid');

    if (!walletAddress && !farcasterFid) {
      return NextResponse.json(
        { error: 'Either walletAddress or farcasterFid is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase.from('unified_users').select('*');

    if (walletAddress && farcasterFid) {
      // Check if both identities match the same user
      query = query.or(`wallet_address.eq.${walletAddress},farcaster_fid.eq.${farcasterFid}`);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    } else if (farcasterFid) {
      query = query.eq('farcaster_fid', parseInt(farcasterFid));
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { error: 'Failed to check link status', details: error },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        linked: false,
        message: 'No user found with provided identities'
      });
    }

    // Check if we found multiple users (conflict)
    if (users.length > 1) {
      return NextResponse.json({
        linked: false,
        conflict: true,
        message: 'Multiple users found - identities are linked to different accounts',
        users: users.map(u => ({
          id: u.id,
          hasWallet: !!u.wallet_address,
          hasFarcaster: !!u.farcaster_fid
        }))
      });
    }

    const user = users[0];

    return NextResponse.json({
      linked: user.identities_linked || false,
      hasWallet: !!user.wallet_address,
      hasFarcaster: !!user.farcaster_fid,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        farcasterFid: user.farcaster_fid,
        username: user.farcaster_username,
        displayName: user.farcaster_display_name,
        linkedAt: user.linked_at,
        primaryIdentity: user.primary_identity
      }
    });

  } catch (error) {
    console.error('Get link status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}