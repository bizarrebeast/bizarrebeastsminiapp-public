import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Use public Base RPC - more reliable than mainnet.base.org
const BASE_RPC = 'https://base.llamarpc.com';

// Minimal ABI for reading stats
const CONTRACT_ABI = [
  'function totalMinted(uint256 tokenId) view returns (uint256)',
  'function nextTokenIdToMint() view returns (uint256)',
  'function getCurrentPrice(uint256 tokenId) view returns (uint256)',
  'function paused() view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId, userAddress } = await request.json();

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Contract address required' },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

    // Read stats from contract (with error handling for all calls)
    const [totalMintedCustom, nextTokenId, currentPrice, isPaused] = await Promise.all([
      contract.totalMinted(tokenId || 0).catch(() => BigInt(0)),
      contract.nextTokenIdToMint().catch(() => BigInt(0)),
      contract.getCurrentPrice(tokenId || 0).catch(() => BigInt(0)),
      contract.paused().catch(() => false),
    ]);

    // Use nextTokenIdToMint if custom totalMinted is 0 (base contract minting was used)
    const totalMinted = Number(totalMintedCustom) > 0 ? Number(totalMintedCustom) : Number(nextTokenId);

    let userBalance = 0;
    if (userAddress) {
      try {
        userBalance = await contract.balanceOf(userAddress, tokenId || 0);
      } catch (error) {
        console.warn('Failed to fetch user balance, defaulting to 0:', error);
        userBalance = 0;
      }
    }

    return NextResponse.json({
      success: true,
      totalMinted,
      currentPrice: currentPrice.toString(),
      isPaused,
      userBalance: Number(userBalance),
    });
  } catch (error: any) {
    console.error('Failed to fetch NFT stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
