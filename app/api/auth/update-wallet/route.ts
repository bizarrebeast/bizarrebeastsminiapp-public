import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/auth/update-wallet
 * Updates the wallet address for an existing Farcaster user
 * This handles cases where users change their preferred wallet in Farcaster
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      farcasterFid,
      newWalletAddress,
      oldWalletAddress,
      signature,
      message
    } = body;

    // Validate required fields
    if (!farcasterFid || !newWalletAddress) {
      return NextResponse.json(
        { error: 'Farcaster FID and new wallet address are required' },
        { status: 400 }
      );
    }

    // Verify wallet ownership through signature if provided
    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== newWalletAddress.toLowerCase()) {
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

    // Check if the Farcaster user exists
    const { data: existingUser, error: userError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', farcasterFid)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { error: 'Farcaster user not found' },
        { status: 404 }
      );
    }

    // Check if new wallet is already taken by another user
    const { data: walletUser, error: walletError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('wallet_address', newWalletAddress.toLowerCase())
      .single();

    if (walletUser && walletUser.id !== existingUser.id) {
      // Another user has this wallet
      if (walletUser.farcaster_fid) {
        // Wallet is linked to another Farcaster account
        return NextResponse.json(
          {
            error: 'Wallet is already linked to another Farcaster account',
            conflictUser: {
              fid: walletUser.farcaster_fid,
              username: walletUser.farcaster_username
            }
          },
          { status: 409 }
        );
      } else {
        // Wallet-only user exists, we can merge
        console.log(`Merging wallet-only user ${walletUser.id} into Farcaster user ${existingUser.id}`);

        // Delete the wallet-only user to free up the wallet
        await supabase
          .from('unified_users')
          .delete()
          .eq('id', walletUser.id);
      }
    }

    // If old wallet is provided and matches, clear it
    if (oldWalletAddress && existingUser.wallet_address?.toLowerCase() === oldWalletAddress.toLowerCase()) {
      console.log(`Removing old wallet ${oldWalletAddress} from user ${existingUser.id}`);
    }

    // Update the user with new wallet
    const updateData: any = {
      wallet_address: newWalletAddress.toLowerCase(),
      wallet_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store wallet history in metadata
    if (!existingUser.metadata) {
      existingUser.metadata = {};
    }
    if (!existingUser.metadata.wallet_history) {
      existingUser.metadata.wallet_history = [];
    }

    if (existingUser.wallet_address && existingUser.wallet_address !== newWalletAddress.toLowerCase()) {
      existingUser.metadata.wallet_history.push({
        address: existingUser.wallet_address,
        removed_at: new Date().toISOString()
      });
    }

    updateData.metadata = {
      ...existingUser.metadata,
      wallet_history: existingUser.metadata.wallet_history,
      last_wallet_update: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from('unified_users')
      .update(updateData)
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet', details: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet updated successfully',
      user: {
        id: updatedUser.id,
        farcasterFid: updatedUser.farcaster_fid,
        username: updatedUser.farcaster_username,
        walletAddress: updatedUser.wallet_address,
        previousWallet: existingUser.wallet_address
      }
    });

  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/update-wallet
 * Checks if a wallet update is needed based on Farcaster verified addresses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      farcasterFid,
      verifiedAddresses,
      currentWalletAddress
    } = body;

    if (!farcasterFid) {
      return NextResponse.json(
        { error: 'Farcaster FID is required' },
        { status: 400 }
      );
    }

    // Get the user
    const { data: user, error: userError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', farcasterFid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current wallet is still verified
    const isCurrentWalletVerified = verifiedAddresses?.some(
      (addr: string) => addr.toLowerCase() === currentWalletAddress?.toLowerCase()
    );

    // Check if user's stored wallet is in verified addresses
    const isStoredWalletVerified = verifiedAddresses?.some(
      (addr: string) => addr.toLowerCase() === user.wallet_address?.toLowerCase()
    );

    // Determine if update is needed
    const needsUpdate = user.wallet_address && !isStoredWalletVerified;
    const suggestedWallet = !isStoredWalletVerified && verifiedAddresses?.length > 0
      ? verifiedAddresses[0]
      : user.wallet_address;

    return NextResponse.json({
      needsUpdate,
      currentWallet: user.wallet_address,
      isCurrentWalletVerified: isStoredWalletVerified,
      suggestedWallet,
      verifiedAddresses,
      message: needsUpdate
        ? 'Your wallet is no longer verified with Farcaster. Please update to a verified wallet.'
        : 'Wallet is up to date'
    });

  } catch (error) {
    console.error('Check wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}