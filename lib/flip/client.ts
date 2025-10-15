/**
 * Client-side functions for Hans' Coin Flip
 */

import { generateSeed, hashSeed } from './provably-fair';

export interface PlaceBetParams {
  walletAddress: string;
  amount: string; // in wei
  choice: 'heads' | 'tails';
  farcasterFid?: number;
  farcasterUsername?: string;
  currentStreak?: number;
}

export interface PlaceBetResponse {
  success: boolean;
  betId: string;
  serverSeedHash: string;
  streakMultiplier: number;
  expiresAt: number;
  message: string;
}

export interface RevealBetParams {
  betId: string;
  clientSeed: string;
}

export interface RevealBetResponse {
  success: boolean;
  result: 'heads' | 'tails';
  isWinner: boolean;
  payout: string;
  currentStreak: number;
  proof: any;
  breakdown: {
    betAmount: string;
    grossPayout: string;
    houseFee: string;
    burnAmount: string;
    netPayout: string;
    streakMultiplier: number;
  };
}

export interface CashoutParams {
  walletAddress: string;
  amount: string;
}

export interface CashoutResponse {
  success: boolean;
  amount: string;
  streak: number;
  message: string;
}

/**
 * Place a new bet
 */
export async function placeBet(params: PlaceBetParams): Promise<PlaceBetResponse> {
  // Generate client seed and hash it
  const clientSeed = generateSeed();
  const clientSeedHash = hashSeed(clientSeed);

  const response = await fetch('/api/flip/bet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
      clientSeedHash
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bet');
  }

  const result = await response.json();

  // Store client seed in session storage for reveal
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`flip_client_seed_${result.betId}`, clientSeed);
  }

  return result;
}

/**
 * Reveal bet result
 */
export async function revealBet(betId: string): Promise<RevealBetResponse> {
  // Get client seed from session storage
  let clientSeed: string | null = null;

  if (typeof window !== 'undefined') {
    clientSeed = sessionStorage.getItem(`flip_client_seed_${betId}`);
  }

  if (!clientSeed) {
    throw new Error('Client seed not found. Cannot reveal bet.');
  }

  const response = await fetch('/api/flip/reveal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      betId,
      clientSeed
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reveal bet');
  }

  const result = await response.json();

  // Clean up session storage
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(`flip_client_seed_${betId}`);
  }

  return result;
}

/**
 * Cash out current streak
 */
export async function cashout(params: CashoutParams): Promise<CashoutResponse> {
  const response = await fetch('/api/flip/cashout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cash out');
  }

  return response.json();
}

/**
 * Get player stats
 */
export async function getPlayerStats(walletAddress: string) {
  const response = await fetch(`/api/flip/stats?wallet=${walletAddress}`);

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  sortBy: string = 'profit',
  timeRange: string = 'all_time',
  limit: number = 100
) {
  const response = await fetch(
    `/api/flip/leaderboard?sortBy=${sortBy}&timeRange=${timeRange}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
}

/**
 * Verify a bet
 */
export async function verifyBet(betId: string) {
  const response = await fetch(`/api/flip/verify?betId=${betId}`);

  if (!response.ok) {
    throw new Error('Failed to verify bet');
  }

  return response.json();
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(wei: string): string {
  const amount = BigInt(wei);
  const divisor = BigInt('1000000000000000000'); // 10^18
  const tokens = amount / divisor;
  const remainder = amount % divisor;

  // Format with thousands separators
  let formatted = tokens.toLocaleString();

  // Add decimal if there's a remainder
  if (remainder > 0) {
    const decimal = Number(remainder) / Number(divisor);
    formatted += decimal.toFixed(2).substring(1); // Remove leading 0
  }

  return formatted + ' $BB';
}

/**
 * Convert $BB amount to wei
 */
export function toWei(tokenAmount: number): string {
  const divisor = BigInt('1000000000000000000'); // 10^18
  return (BigInt(Math.floor(tokenAmount)) * divisor).toString();
}
