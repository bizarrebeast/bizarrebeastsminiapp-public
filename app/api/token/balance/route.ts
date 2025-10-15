import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Use public Base RPC - more reliable than mainnet.base.org
const BASE_RPC = 'https://base.llamarpc.com';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress, walletAddress } = await request.json();

    if (!tokenAddress || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Token address and wallet address required' },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const balance = await tokenContract.balanceOf(walletAddress);

    return NextResponse.json({
      success: true,
      balance: balance.toString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch token balance:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
