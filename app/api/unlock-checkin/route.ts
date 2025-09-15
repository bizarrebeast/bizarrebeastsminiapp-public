import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

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
    const { walletAddress, ritualsCompleted } = await request.json();

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

    // Check if already unlocked
    const isUnlocked = await gatekeeper.canUserCheckIn(walletAddress);

    if (isUnlocked) {
      return NextResponse.json({
        success: true,
        message: 'Check-in already unlocked',
        alreadyUnlocked: true
      });
    }

    // Unlock the check-in
    console.log(`Unlocking check-in for ${walletAddress} with ${ritualsCompleted} rituals completed`);
    const tx = await gatekeeper.unlockCheckIn(walletAddress, ritualsCompleted);

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      message: 'Check-in unlocked successfully',
      transactionHash: receipt.hash,
      alreadyUnlocked: false
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