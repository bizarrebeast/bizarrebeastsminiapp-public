/**
 * Neynar API Client Configuration
 * Handles all Farcaster-related operations via Neynar
 */

import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

// Initialize Neynar client
let neynarClient: NeynarAPIClient | null = null;

export function getNeynarClient(): NeynarAPIClient {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not configured');
    }

    const config = new Configuration({
      apiKey: apiKey,
    });

    neynarClient = new NeynarAPIClient(config);
  }

  return neynarClient;
}

// Helper types
export interface VerificationResult {
  verified: boolean;
  cast?: any;
  message?: string;
}

export interface UserProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
}

// Utility functions for common operations
export async function searchUserCastsForRitual(
  fid: number,
  ritualId: number,
  hashtag: string = '#BBRituals'
): Promise<VerificationResult> {
  try {
    console.log(`Verifying share for FID ${fid}, Ritual ${ritualId}, Hashtag: ${hashtag}`);

    // Use direct API call instead of SDK - SDK method uses wrong endpoint
    // Correct endpoint: /v2/farcaster/feed/user/casts
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not configured');
    }

    const response = await fetch(`https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=50`, {
      headers: {
        'api_key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    const recentCasts = await response.json();

    // Check if any cast mentions the ritual - use scoring system for better accuracy
    const ritualKeywords = getRitualKeywords(ritualId);
    const ritualSpecificHashtag = RITUAL_HASHTAGS[ritualId] || hashtag;

    // Score each cast to find best match
    const scoredCasts = recentCasts.casts?.map((cast: any) => {
      const text = cast.text?.toLowerCase() || '';
      const castTime = new Date(cast.timestamp).getTime();
      const hoursSincePost = (Date.now() - castTime) / (1000 * 60 * 60);

      // Must be within 24 hours
      if (hoursSincePost > 24) return { cast, score: 0 };

      let score = 0;

      // Check embeds for ritual URL (strongest signal)
      const hasRitualEmbed = cast.embeds?.some((embed: any) => {
        const url = embed.url?.toLowerCase() || '';
        // Ritual 11 uses /flip URL instead of /rituals/11
        if (ritualId === 11) {
          return url.includes('/flip') || url.includes(`/rituals/${ritualId}`);
        }
        return url.includes(`/rituals/${ritualId}`) ||
               url.includes('bbapp.bizarrebeasts.io/rituals');
      });
      if (hasRitualEmbed) score += 50;

      // Check for ritual-specific hashtag
      if (text.includes(ritualSpecificHashtag.toLowerCase())) score += 30;

      // Check for generic hashtag
      if (text.includes('#bbrituals')) score += 20;

      // Check for ritual keywords
      if (ritualKeywords.some(keyword => text.includes(keyword.toLowerCase()))) score += 15;

      // Check for "ritual" mention
      if (text.includes('ritual')) score += 10;

      // Check for BizarreBeasts mention
      if (text.includes('bizarre') || text.includes('$bb')) score += 10;

      // Bonus for recency (within last hour)
      if (hoursSincePost < 1) score += 5;

      return { cast, score };
    }) || [];

    // Find best match (need score >= 40 for verification)
    const bestMatch = scoredCasts.sort((a: any, b: any) => b.score - a.score)[0];
    const recentRitualCast = bestMatch && bestMatch.score >= 40 ? bestMatch.cast : null;

    if (recentRitualCast) {
      console.log(`✅ Found verified cast for ritual ${ritualId}:`, recentRitualCast.hash, `(score: ${bestMatch.score})`);
      return {
        verified: true,
        cast: recentRitualCast,
        message: `Share verified successfully (confidence: ${bestMatch.score}/100)`
      };
    }

    console.log(`❌ No verified cast found for FID ${fid}, Ritual ${ritualId}`);

    // For debugging, log top scored casts to understand what we're getting
    if (scoredCasts.length > 0) {
      console.log('Top scored casts:', scoredCasts.slice(0, 3).map((sc: any) => ({
        text: sc.cast.text?.substring(0, 50),
        timestamp: sc.cast.timestamp,
        embeds: sc.cast.embeds?.length || 0,
        score: sc.score
      })));
    }

    return {
      verified: false,
      message: 'No matching cast found. Please share to complete the ritual.'
    };
  } catch (error) {
    console.error('Error verifying share:', error);

    // If Neynar API fails, check if it's a rate limit or connection issue
    if (error instanceof Error && error.message.includes('rate')) {
      return {
        verified: false,
        message: 'Rate limit reached. Please try again in a moment.'
      };
    }

    // For development/testing, allow auto-verification if API fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Neynar API error in dev mode, auto-verifying');
      return {
        verified: true,
        message: 'Share auto-verified (dev mode)'
      };
    }

    return {
      verified: false,
      message: 'Error verifying share. Please try again.'
    };
  }
}

// Ritual-specific hashtags for verification
export const RITUAL_HASHTAGS: { [key: number]: string } = {
  1: '#BBRitualMeme',
  2: '#BBRitualDex',
  3: '#BBRitualBRND',
  4: '#BBRitualCreateGive',
  5: '#BBRitualBelieve',
  6: '#BBRitualGames',
  7: '#BBRitualVibe',
  8: '#BBRitualSwap',
  9: '#BBRitualEmpire',
  10: '#BBRitualProveIt',
  11: '#BBRitualCoinToss',
  0: '#BBRitualFeatured'
};

// Helper function to get ritual-specific keywords
function getRitualKeywords(ritualId: number): string[] {
  const ritualKeywords: { [key: number]: string[] } = {
    1: ['meme', 'create', 'meme creator'],
    2: ['dexscreener', 'dex', 'fire up'],
    3: ['brnd', 'podium', '$brnd'],
    4: ['create give', 'give', 'based creators'],
    5: ['believe', 'productclank', 'clank'],
    6: ['game', 'games', 'remix', 'play'],
    7: ['cards', 'pack', 'vibemarket', 'vibe'],
    8: ['swap', 'buy', 'tokens', '1m $bb'],
    9: ['leaderboard', 'rank', 'empire'],
    10: ['prove it', 'attestation', 'onchain'],
    11: ['coin toss', 'flip', 'bizbe', 'heads', 'tails', 'won'],
    0: ['featured', 'special ritual', 'limited time']
  };

  return ritualKeywords[ritualId] || ['ritual', 'bizarre beasts'];
}

export async function getUserByFid(fid: number): Promise<UserProfile | null> {
  try {
    const client = getNeynarClient();

    // The SDK methods vary by version
    // For now, return a mock profile for development
    console.log(`Fetching user profile for FID ${fid}`);

    // In production, implement actual user lookup using the correct SDK method
    return {
      fid: fid,
      username: `user${fid}`,
      displayName: `User ${fid}`,
      pfpUrl: undefined,
      bio: undefined,
      followerCount: 0,
      followingCount: 0,
      powerBadge: false
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}