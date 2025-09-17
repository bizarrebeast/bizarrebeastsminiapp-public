/**
 * Token balance checking for contest entry requirements
 * Checks actual $BB token balance on-chain (not Empire rank)
 */

import { ethers } from 'ethers';
import { web3Service } from './web3';

// BizarreBeasts $BB token contract on Base
const BB_TOKEN_ADDRESS = '0x0520bf1d3cEE163407aDA79109333aB1599b4004';

// Minimal ERC20 ABI for balance checking
const BB_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Get $BB token balance for a wallet address
 * @param walletAddress - The wallet address to check
 * @returns Balance as a string in human-readable format
 */
export async function getBBBalance(walletAddress: string): Promise<string> {
  try {
    // Get provider from web3Service
    const provider = await web3Service.getProvider();
    if (!provider) {
      console.error('No provider available');
      return '0';
    }

    // Create contract instance
    const contract = new ethers.Contract(BB_TOKEN_ADDRESS, BB_TOKEN_ABI, provider);

    // Get balance
    const balance = await contract.balanceOf(walletAddress);

    // Get decimals (should be 18 for $BB)
    const decimals = await contract.decimals();

    // Convert from wei to human-readable format
    const formatted = ethers.formatUnits(balance, decimals);

    return formatted;
  } catch (error) {
    console.error('Error fetching $BB balance:', error);
    return '0';
  }
}

/**
 * Check if wallet meets token requirement for contest
 * @param balance - Current token balance
 * @param requirement - Required token amount
 * @returns True if balance meets requirement
 */
export function meetsTokenRequirement(balance: string, requirement: number): boolean {
  try {
    const balanceNum = parseFloat(balance);
    return balanceNum >= requirement;
  } catch (error) {
    console.error('Error checking token requirement:', error);
    return false;
  }
}

/**
 * Format token balance for display
 * @param balance - Token balance as string
 * @param decimals - Number of decimal places to show
 * @returns Formatted balance string
 */
export function formatTokenBalance(balance: string, decimals: number = 2): string {
  try {
    const balanceNum = parseFloat(balance);

    // Format large numbers
    if (balanceNum >= 1000000) {
      return `${(balanceNum / 1000000).toFixed(1)}M`;
    } else if (balanceNum >= 1000) {
      return `${(balanceNum / 1000).toFixed(1)}K`;
    }

    // For smaller numbers, show decimals
    return balanceNum.toFixed(decimals);
  } catch (error) {
    return '0';
  }
}

/**
 * Cache for token balances to reduce RPC calls
 * Expires after 5 minutes
 */
const balanceCache = new Map<string, { balance: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached balance or fetch new one
 */
export async function getCachedBBBalance(walletAddress: string): Promise<string> {
  const cached = balanceCache.get(walletAddress.toLowerCase());

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balance;
  }

  const balance = await getBBBalance(walletAddress);

  balanceCache.set(walletAddress.toLowerCase(), {
    balance,
    timestamp: Date.now()
  });

  return balance;
}

/**
 * Clear balance cache for a specific wallet
 */
export function clearBalanceCache(walletAddress?: string): void {
  if (walletAddress) {
    balanceCache.delete(walletAddress.toLowerCase());
  } else {
    balanceCache.clear();
  }
}