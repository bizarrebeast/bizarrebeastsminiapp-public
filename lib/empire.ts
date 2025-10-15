// Empire Builder API Integration Service
const EMPIRE_API_BASE = 'https://www.empirebuilder.world/api';
const BB_TOKEN_ADDRESS = '0x0520bf1d3cEE163407aDA79109333aB1599b4004';

export interface Boost {
  boosterId: string;
  multiplier: number;
  type: 'ERC20' | 'NFT';
  contractAddress: string;
}

export interface EmpireHolder {
  address: string;
  balance: string;
  baseBalance: string;
  appliedBoosts: Boost[];
  finalMultiplier: number;
  isLP: boolean;
  farcasterUsername?: string | null;
  rank: number;
}

export interface EmpireLeaderboard {
  holders: EmpireHolder[];
  cached: boolean;
}

// Tier system - Embrace the weirdness!
export enum AccessTier {
  BIZARRE = 'bizarre',   // Rank 1-25 - You ARE the Bizarre Beast
  WEIRDO = 'weirdo',     // Rank 26-50 - Embracing the weird
  ODDBALL = 'oddball',   // Rank 51-100 - Delightfully odd
  MISFIT = 'misfit',     // Rank 101-500 - Don't quite fit in (yet)
  NORMIE = 'normie'      // Rank 501+ or not on leaderboard - Still too normal
}

export class EmpireService {
  private static instance: EmpireService;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): EmpireService {
    if (!EmpireService.instance) {
      EmpireService.instance = new EmpireService();
    }
    return EmpireService.instance;
  }

  async getLeaderboard(): Promise<EmpireLeaderboard> {
    const cacheKey = 'leaderboard';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/empire/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      
      // Check if we got an error response
      if (data.error) {
        console.error('Empire API error:', data.error);
        return { holders: [], cached: false };
      }
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching Empire leaderboard:', error);
      // Return empty leaderboard on error
      return { holders: [], cached: false };
    }
  }

  async getUserByAddress(address: string): Promise<EmpireHolder | null> {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.holders.find(h => 
      h.address.toLowerCase() === address.toLowerCase()
    ) || null;
  }

  async getUserByUsername(username: string): Promise<EmpireHolder | null> {
    const leaderboard = await this.getLeaderboard();
    const searchTerm = username.toLowerCase().replace('@', '');
    return leaderboard.holders.find(h => 
      h.farcasterUsername?.toLowerCase().replace('@', '') === searchTerm
    ) || null;
  }

  async searchUser(query: string): Promise<EmpireHolder | null> {
    if (!query) return null;
    
    // Check if it's an address (starts with 0x)
    if (query.toLowerCase().startsWith('0x')) {
      return this.getUserByAddress(query);
    }
    
    // Otherwise search by username
    return this.getUserByUsername(query);
  }

  async getUserRank(address: string): Promise<number | null> {
    const user = await this.getUserByAddress(address);
    return user?.rank || null;
  }

  getUserTier(rank: number | null): AccessTier {
    if (!rank) return AccessTier.NORMIE;

    // Tier thresholds - embrace the weirdness!
    if (rank <= 25) return AccessTier.BIZARRE;
    if (rank <= 50) return AccessTier.WEIRDO;
    if (rank <= 100) return AccessTier.ODDBALL;
    if (rank <= 500) return AccessTier.MISFIT;
    return AccessTier.NORMIE;
  }

  async getUserTierByAddress(address: string): Promise<AccessTier> {
    // First check for dedication path to BIZARRE tier (100-day streak)
    try {
      const response = await fetch(`/api/attestations/streak?wallet=${address}`);
      if (response.ok) {
        const streakData = await response.json();

        // 100-day streak grants automatic BIZARRE tier
        if (streakData.has_bizarre_tier_override) {
          return AccessTier.BIZARRE;
        }
      }
    } catch (error) {
      console.error('Error checking attestation streak:', error);
    }

    // Fall back to rank-based tier
    const rank = await this.getUserRank(address);
    return this.getUserTier(rank);
  }

  // New method for enhanced tier calculation with streak override
  async getUserTierWithStreak(address: string, rank: number | null): Promise<{
    tier: AccessTier;
    isStreakBased: boolean;
    streakDays: number;
  }> {
    let isStreakBased = false;
    let streakDays = 0;
    let tier = this.getUserTier(rank);

    // Check for dedication path override
    try {
      const response = await fetch(`/api/attestations/streak?wallet=${address}`);
      if (response.ok) {
        const streakData = await response.json();
        streakDays = streakData.best_streak || 0;

        // 100-day streak grants BIZARRE tier regardless of rank
        if (streakData.has_bizarre_tier_override) {
          tier = AccessTier.BIZARRE;
          isStreakBased = true;
        }
      }
    } catch (error) {
      console.error('Error checking attestation streak:', error);
    }

    return { tier, isStreakBased, streakDays };
  }

  // Format large numbers for display
  formatScore(score: string): string {
    const num = parseFloat(score) / 1e18; // Assuming 18 decimals
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  }

  // Format address for display
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get tier benefits - embrace your weirdness level!
  getTierBenefits(tier: AccessTier): string[] {
    switch(tier) {
      case AccessTier.BIZARRE:
        return [
          'All sticker collections unlocked',
          'No watermark on exports',
          'Premium backgrounds',
          'Contest creation',
          'AI background removal'
        ];
      case AccessTier.WEIRDO:
        return [
          'Most sticker collections',
          'No watermark on exports',
          'Custom backgrounds',
          'Contest voting power 2x'
        ];
      case AccessTier.ODDBALL:
        return [
          'Advanced sticker collections',
          'No watermark on exports',
          'Contest participation'
        ];
      case AccessTier.MISFIT:
        return [
          'Basic sticker collections',
          'Custom backgrounds',
          'Contest viewing'
        ];
      default:
        return [
          'Basic stickers only',
          'Watermark on all exports',
          'View leaderboard'
        ];
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const empireService = EmpireService.getInstance();

/**
 * Server-side function to fetch Empire data directly from API
 * (bypasses client-side service)
 */
export async function fetchEmpireDataServer(walletAddress: string, retries: number = 2): Promise<{
  tier: string | null;
  rank: number | null;
}> {
  const timeout = 5000; // 5 second timeout

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const holder = data.holders?.find((h: any) =>
          h.address?.toLowerCase() === walletAddress.toLowerCase()
        );

        if (holder) {
          const rank = holder.rank || null;
          // Use auth/profile tier thresholds for consistency
          let tier: string | null = null;
          if (rank) {
            if (rank <= 25) tier = 'BIZARRE';  // Fixed: was 10, should be 25
            else if (rank <= 50) tier = 'WEIRDO';
            else if (rank <= 100) tier = 'ODDBALL';  // Fixed: was 150, should be 100
            else if (rank <= 500) tier = 'MISFIT';
            else tier = 'NORMIE';
          }
          return { tier, rank };
        }

        return { tier: null, rank: null };
      }

      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (error: any) {
      if (attempt === retries) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { tier: null, rank: null };
}