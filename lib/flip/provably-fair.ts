/**
 * Provably Fair Logic for Hans' Coin Flip
 *
 * Uses commit-reveal scheme:
 * 1. Server commits to a random seed (hash)
 * 2. Client commits to a random seed (hash)
 * 3. Both seeds revealed after bet placed
 * 4. Combined hash determines result
 * 5. All seeds stored for verification
 */

import crypto from 'crypto';

/**
 * Generate a random seed (32 bytes as hex)
 */
export function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a seed using SHA-256
 */
export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

/**
 * Combine two seeds and hash them
 */
export function combineSeeds(clientSeed: string, serverSeed: string): string {
  const combined = clientSeed + serverSeed;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Determine flip result from combined hash
 * Takes first byte of hash, converts to number, modulo 2
 * 0 = heads, 1 = tails
 */
export function determineResult(combinedHash: string): 'heads' | 'tails' {
  // Take first 2 characters (1 byte)
  const firstByte = parseInt(combinedHash.substring(0, 2), 16);
  const result = firstByte % 2;
  return result === 0 ? 'heads' : 'tails';
}

/**
 * Verify that a hash matches its seed
 */
export function verifySeed(seed: string, hash: string): boolean {
  return hashSeed(seed) === hash;
}

/**
 * Verify entire bet outcome
 */
export function verifyBetOutcome(
  clientSeed: string,
  clientSeedHash: string,
  serverSeed: string,
  serverSeedHash: string,
  combinedHash: string,
  result: 'heads' | 'tails'
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verify client seed matches hash
  if (!verifySeed(clientSeed, clientSeedHash)) {
    errors.push('Client seed does not match client seed hash');
  }

  // Verify server seed matches hash
  if (!verifySeed(serverSeed, serverSeedHash)) {
    errors.push('Server seed does not match server seed hash');
  }

  // Verify combined hash
  const expectedCombinedHash = combineSeeds(clientSeed, serverSeed);
  if (combinedHash !== expectedCombinedHash) {
    errors.push('Combined hash does not match expected value');
  }

  // Verify result
  const expectedResult = determineResult(combinedHash);
  if (result !== expectedResult) {
    errors.push(`Result should be ${expectedResult}, got ${result}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate payout based on bet amount and house edge
 */
export function calculatePayout(
  betAmount: bigint,
  isWin: boolean,
  streakMultiplier: number = 1.0,
  houseEdge: number = 0.02 // 2%
): {
  grossPayout: bigint;
  netPayout: bigint;
  houseFee: bigint;
  burnAmount: bigint;
} {
  if (!isWin) {
    return {
      grossPayout: BigInt(0),
      netPayout: BigInt(0),
      houseFee: BigInt(0),
      burnAmount: BigInt(0)
    };
  }

  // Base payout (2x bet)
  const basePayout = betAmount * BigInt(2);

  // Apply house edge (2%)
  const houseEdgeBigInt = BigInt(Math.floor(houseEdge * 10000)); // 200 for 2%
  const edgeAmount = (basePayout * houseEdgeBigInt) / BigInt(10000);

  // Split house edge: 75% profit, 25% burn (1.5% and 0.5%)
  const houseFee = (edgeAmount * BigInt(75)) / BigInt(100); // 1.5%
  const burnAmount = (edgeAmount * BigInt(25)) / BigInt(100); // 0.5%

  // Net payout after house edge
  let netPayout = basePayout - edgeAmount;

  // Apply streak multiplier if > 1
  if (streakMultiplier > 1.0) {
    const multiplierBigInt = BigInt(Math.floor(streakMultiplier * 100));
    netPayout = (netPayout * multiplierBigInt) / BigInt(100);
  }

  return {
    grossPayout: basePayout,
    netPayout,
    houseFee,
    burnAmount
  };
}

/**
 * Get streak multiplier based on win count
 */
export function getStreakMultiplier(winCount: number): number {
  if (winCount <= 1) return 1.0;
  if (winCount === 2) return 1.2;
  if (winCount === 3) return 1.5;
  if (winCount === 4) return 2.0;
  if (winCount === 5) return 3.0;
  return 5.0; // 6+ wins
}

/**
 * Format proof data for verification
 */
export interface ProofData {
  betId: string;
  clientSeed: string;
  clientSeedHash: string;
  serverSeed: string;
  serverSeedHash: string;
  combinedHash: string;
  result: 'heads' | 'tails';
  choice: 'heads' | 'tails';
  isWinner: boolean;
  timestamp: number;
}

export function generateProof(
  betId: string,
  clientSeed: string,
  clientSeedHash: string,
  serverSeed: string,
  serverSeedHash: string,
  choice: 'heads' | 'tails'
): ProofData {
  const combinedHash = combineSeeds(clientSeed, serverSeed);
  const result = determineResult(combinedHash);
  const isWinner = result === choice;

  return {
    betId,
    clientSeed,
    clientSeedHash,
    serverSeed,
    serverSeedHash,
    combinedHash,
    result,
    choice,
    isWinner,
    timestamp: Date.now()
  };
}
