/**
 * Flip Game Tier Helper
 * Determines user tier based on verified wallet from Farcaster profile
 */

import { getNeynarClient } from '@/lib/neynar';
import { fetchEmpireDataServer } from '@/lib/empire';

// Tier-based daily flip limits
export const TIER_FLIP_LIMITS: Record<string, number> = {
  'BIZARRE': 6,
  'WEIRDO': 5,
  'ODDBALL': 4,
  'MISFIT': 3,
  'NORMIE': 3
};

export interface UserTierInfo {
  tier: string;
  empireRank: number | null;
  walletUsedForTier: string;
  maxDailyFlips: number;
}

/**
 * Get user's tier based on their verified wallet (FID-first approach)
 *
 * Logic:
 * 1. If FID provided, fetch verified addresses from Neynar
 * 2. Use first verified address to check tier (this is their primary wallet)
 * 3. If no verified addresses or FID, fall back to provided wallet
 * 4. This ensures users get their tier benefits regardless of which wallet they're using
 *
 * @param walletAddress - Current wallet address (may be Farcaster wallet)
 * @param farcasterFid - User's Farcaster FID
 * @returns User tier information
 */
export async function getUserTierInfo(
  walletAddress: string | null | undefined,
  farcasterFid: number | null | undefined
): Promise<UserTierInfo> {
  let tierCheckWallet = walletAddress;
  let tier = 'NORMIE';
  let empireRank: number | null = null;

  // Priority 1: If we have FID, get verified wallet for tier check
  if (farcasterFid) {
    try {
      console.log(`[tier-helper] Fetching verified addresses for FID ${farcasterFid}`);
      const neynar = getNeynarClient();
      const bulkUsers = await neynar.fetchBulkUsers({ fids: [farcasterFid] });

      if (bulkUsers.users && bulkUsers.users.length > 0) {
        const user = bulkUsers.users[0];
        const verifiedAddresses = user.verified_addresses?.eth_addresses || [];

        if (verifiedAddresses.length > 0) {
          // Use first verified address as primary wallet for tier
          tierCheckWallet = verifiedAddresses[0];
          console.log(`[tier-helper] Using verified wallet for tier: ${tierCheckWallet}`);
        } else {
          console.log(`[tier-helper] FID ${farcasterFid} has no verified addresses`);
        }
      }
    } catch (err) {
      console.log(`[tier-helper] Could not fetch verified addresses for FID ${farcasterFid}:`, err);
      // Fall through to use provided wallet
    }
  }

  // Priority 2: If we have a wallet to check (either verified or provided), get tier
  if (tierCheckWallet) {
    try {
      console.log(`[tier-helper] Checking Empire tier for wallet: ${tierCheckWallet}`);
      const empireData = await fetchEmpireDataServer(tierCheckWallet);

      if (empireData.tier) {
        tier = empireData.tier;
        empireRank = empireData.rank;
        console.log(`[tier-helper] Empire data: rank=${empireRank}, tier=${tier}`);
      } else {
        console.log(`[tier-helper] No Empire data found, defaulting to NORMIE`);
      }
    } catch (err) {
      console.log(`[tier-helper] Error fetching Empire data, defaulting to NORMIE:`, err);
    }
  } else {
    console.log(`[tier-helper] No wallet to check tier for, defaulting to NORMIE`);
  }

  const maxDailyFlips = TIER_FLIP_LIMITS[tier] || 1;

  return {
    tier,
    empireRank,
    walletUsedForTier: tierCheckWallet || 'none',
    maxDailyFlips
  };
}
