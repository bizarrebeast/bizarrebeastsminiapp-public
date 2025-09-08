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

// Tier system (placeholder - will be fine-tuned later)
export enum AccessTier {
  ELITE = 'elite',      // Rank 1-10
  CHAMPION = 'champion', // Rank 11-50
  VETERAN = 'veteran',   // Rank 51-100
  MEMBER = 'member',     // Rank 101-500
  VISITOR = 'visitor'    // Rank 501+ or not on leaderboard
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
      const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
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
    if (!rank) return AccessTier.VISITOR;
    
    // Placeholder tiers - will be fine-tuned
    if (rank <= 10) return AccessTier.ELITE;
    if (rank <= 50) return AccessTier.CHAMPION;
    if (rank <= 100) return AccessTier.VETERAN;
    if (rank <= 500) return AccessTier.MEMBER;
    return AccessTier.VISITOR;
  }

  async getUserTierByAddress(address: string): Promise<AccessTier> {
    const rank = await this.getUserRank(address);
    return this.getUserTier(rank);
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

  // Get tier benefits (placeholder - will be customized)
  getTierBenefits(tier: AccessTier): string[] {
    switch(tier) {
      case AccessTier.ELITE:
        return [
          'All sticker collections unlocked',
          'No watermark on exports',
          'Premium backgrounds',
          'Contest creation',
          'AI background removal'
        ];
      case AccessTier.CHAMPION:
        return [
          'Most sticker collections',
          'No watermark on exports',
          'Custom backgrounds',
          'Contest voting power 2x'
        ];
      case AccessTier.VETERAN:
        return [
          'Advanced sticker collections',
          'No watermark on exports',
          'Contest participation'
        ];
      case AccessTier.MEMBER:
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