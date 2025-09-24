import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const GATEKEEPER_ABI = [
  "function updateRitualCount(address user, uint256 ritualsToday) external",
  "function canUserCheckIn(address user) external view returns (bool)"
];

// Contract address on Base Mainnet (Production)
const GATEKEEPER_ADDRESS = "0x0f57b7755A1CBa924fC23d6b40153668245DBd1a";

// Get private key from environment variable
const PRIVATE_KEY = process.env.RITUAL_ADMIN_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    // Check current status before resetting
    const wasUnlocked = await gatekeeper.canUserCheckIn(walletAddress);
    console.log(`User ${walletAddress} was ${wasUnlocked ? 'unlocked' : 'locked'} before reset`);

    // Reset the ritual count to 0 to lock the user
    console.log(`Resetting ritual count for ${walletAddress} after successful check-in`);
    const tx = await gatekeeper.updateRitualCount(walletAddress, 0);

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Verify the user is now locked
    const isNowLocked = !(await gatekeeper.canUserCheckIn(walletAddress));
    console.log(`User ${walletAddress} is now ${isNowLocked ? 'locked' : 'still unlocked'}`);

    return NextResponse.json({
      success: true,
      message: 'Ritual requirement reset successfully',
      wasUnlocked,
      isNowLocked,
      transactionHash: receipt.hash
    });

  } catch (error: any) {
    console.error('Reset ritual error:', error);

    return NextResponse.json(
      {
        error: 'Failed to reset ritual requirement',
        details: error.message
      },
      { status: 500 }
    );
  }
}