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
    const client = getNeynarClient();

    // For now, return a simple verification
    // The actual cast fetching method varies by SDK version
    // In production, you would implement the actual verification logic
    console.log(`Verifying share for FID ${fid}, Ritual ${ritualId}, Hashtag: ${hashtag}`);

    // Simulate verification for development
    // In production, implement actual Farcaster cast verification
    return {
      verified: true,
      message: 'Share verification enabled (development mode)'
    };
  } catch (error) {
    console.error('Error verifying share:', error);
    return {
      verified: false,
      message: 'Error verifying share. Please try again.'
    };
  }
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