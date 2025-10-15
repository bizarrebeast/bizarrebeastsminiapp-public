import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Contract ABI - only the function we need
const GATEKEEPER_ABI = [
  "function unlockCheckIn(address user, uint256 ritualsCompleted) external",
  "function canUserCheckIn(address user) external view returns (bool)",
  "function setAuthorizedAddress(address) external"
];

// Contract address on Base Mainnet (Production)
const GATEKEEPER_ADDRESS = "0x0f57b7755A1CBa924fC23d6b40153668245DBd1a";

// Get private key from environment variable (MUST be set in .env.local)
const PRIVATE_KEY = process.env.RITUAL_ADMIN_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, ritualsCompleted, fid } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate the rituals completed (must be at least 3)
    if (!ritualsCompleted || ritualsCompleted < 3) {
      return NextResponse.json(
        { error: 'At least 3 rituals must be completed' },
        { status: 400 }
      );
    }

    // If FID provided, unlock all wallets associated with that FID
    let walletsToUnlock = [walletAddress];
    if (fid) {
      console.log(`FID ${fid} provided - checking for additional wallets to unlock`);

      // Get all verified wallets for this FID from the users table
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get all user records with this FID
      const { data: userRecords } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('farcaster_fid', fid);

      if (userRecords && userRecords.length > 0) {
        const additionalWallets = userRecords
          .map(r => r.wallet_address)
          .filter(w => w && w !== walletAddress.toLowerCase());

        if (additionalWallets.length > 0) {
          walletsToUnlock = [walletAddress, ...additionalWallets];
          console.log(`Found ${additionalWallets.length} additional wallets for FID ${fid}`);
        }
      }
    }

    if (!PRIVATE_KEY) {
      console.error('RITUAL_ADMIN_PRIVATE_KEY not set in environment');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Connect to Base Mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Connect to the gatekeeper contract
    const gatekeeper = new ethers.Contract(
      GATEKEEPER_ADDRESS,
      GATEKEEPER_ABI,
      wallet
    );

    // Track which wallets were unlocked
    const unlockedWallets = [];
    const alreadyUnlockedWallets = [];
    const failedWallets = [];

    // Process each wallet
    for (const wallet of walletsToUnlock) {
      try {
        // Check if already unlocked
        let isUnlocked = false;
        try {
          isUnlocked = await gatekeeper.canUserCheckIn(wallet);
        } catch (checkError: any) {
          // If BAD_DATA error, wallet is not registered yet - treat as not unlocked
          if (checkError.code === 'BAD_DATA') {
            console.log(`Wallet ${wallet} not registered in contract yet (BAD_DATA) - will unlock`);
            isUnlocked = false;
          } else {
            throw checkError; // Re-throw other errors
          }
        }

        if (isUnlocked) {
          alreadyUnlockedWallets.push(wallet);
          console.log(`Wallet ${wallet} already unlocked`);
          continue;
        }

        // Unlock the check-in
        console.log(`Unlocking check-in for ${wallet} with ${ritualsCompleted} rituals completed`);
        const tx = await gatekeeper.unlockCheckIn(wallet, ritualsCompleted);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        unlockedWallets.push({
          wallet,
          txHash: receipt.hash
        });
        console.log(`Successfully unlocked ${wallet} - tx: ${receipt.hash}`);
      } catch (error) {
        console.error(`Failed to unlock ${wallet}:`, error);
        failedWallets.push({
          wallet,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: unlockedWallets.length > 0 || alreadyUnlockedWallets.length > 0,
      message: fid
        ? `Check-ins processed for FID ${fid}`
        : 'Check-in unlock processed',
      unlockedWallets,
      alreadyUnlockedWallets,
      failedWallets,
      totalProcessed: walletsToUnlock.length
    });

  } catch (error: any) {
    console.error('Unlock check-in error:', error);

    // Check if it's a permission error
    if (error.message?.includes('not authorized')) {
      return NextResponse.json(
        {
          error: 'Not authorized to unlock check-ins',
          details: 'The server wallet is not authorized to unlock check-ins'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to unlock check-in',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Connect to Base Mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

    // Connect to the gatekeeper contract (read-only)
    const gatekeeper = new ethers.Contract(
      GATEKEEPER_ADDRESS,
      GATEKEEPER_ABI,
      provider
    );

    // Check if unlocked
    const isUnlocked = await gatekeeper.canUserCheckIn(walletAddress);

    return NextResponse.json({
      walletAddress,
      isUnlocked,
      message: isUnlocked ? 'Check-in is unlocked' : 'Check-in is locked - complete 3 rituals'
    });

  } catch (error: any) {
    console.error('Check status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check status',
        details: error.message
      },
      { status: 500 }
    );
  }
}