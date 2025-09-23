/**
 * Enhanced Neynar API Client for Comprehensive User Stats
 * Provides advanced user analytics and data fetching capabilities
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

// Enhanced Types
export interface UserStats {
  profile: UserProfile;
  engagement: EngagementMetrics;
  growth: GrowthMetrics;
  channels: ChannelActivity[];
  recentCasts: Cast[];
  topCasts: Cast[];
}

export interface UserProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge: boolean;
  activeStatus: string;
  verifications?: Verification[];
  verifiedAddresses?: string[];
  profile?: {
    bio?: {
      text?: string;
    };
    location?: string;
  };
  viewerContext?: {
    following: boolean;
    followedBy: boolean;
  };
}

export interface EngagementMetrics {
  totalCasts: number;
  totalReplies: number;
  totalRecasts: number;
  totalLikes: number;
  avgEngagementRate: number;
  last7DaysActive: boolean;
  last30DaysActive: boolean;
}

export interface GrowthMetrics {
  followerGrowth7d: number;
  followerGrowth30d: number;
  followingGrowth7d: number;
  followingGrowth30d: number;
  followerGrowthRate: number;
}

export interface ChannelActivity {
  channelId: string;
  channelName: string;
  castCount: number;
  lastActiveAt: string;
  role?: string;
}

export interface Cast {
  hash: string;
  text: string;
  timestamp: string;
  author: {
    fid: number;
    username: string;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
  channel?: string;
  embeds?: any[];
  parent_hash?: string;
}

export interface Verification {
  fid: number;
  address: string;
  timestamp: string;
  type?: number;
  protocol?: number;
}

export interface SearchResult {
  users: UserProfile[];
  next?: {
    cursor?: string;
  };
}

// Main Functions

/**
 * Fetch comprehensive user stats by FID
 */
export async function getUserStats(fid: number): Promise<UserStats | null> {
  try {
    const client = getNeynarClient();

    // Fetch user profile
    const profile = await getUserProfile(fid);
    if (!profile) return null;

    // Fetch additional metrics (these would be real API calls in production)
    const engagement = await getEngagementMetrics(fid);
    const growth = await getGrowthMetrics(fid);
    const channels = await getChannelActivity(fid);
    const recentCasts = await getRecentCasts(fid);
    const topCasts = await getTopCasts(fid);

    return {
      profile,
      engagement,
      growth,
      channels,
      recentCasts,
      topCasts,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

/**
 * Get user profile by FID
 */
export async function getUserProfile(fid: number): Promise<UserProfile | null> {
  try {
    const client = getNeynarClient();

    // Use the bulk users endpoint for a single user
    const response = await client.fetchBulkUsers({ fids: [fid] });

    if (!response.users || response.users.length === 0) {
      return null;
    }

    const user = response.users[0];

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || user.pfp?.url,
      bio: user.profile?.bio?.text,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      powerBadge: user.power_badge || false,
      activeStatus: user.active_status || 'inactive',
      verifications: user.verifications,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      profile: user.profile,
      viewerContext: user.viewer_context,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return mock data for development if API fails
    return {
      fid: fid,
      username: `user${fid}`,
      displayName: `User ${fid}`,
      followerCount: 0,
      followingCount: 0,
      powerBadge: false,
      activeStatus: 'inactive',
    };
  }
}

/**
 * Search users by username
 */
export async function searchUsers(query: string, limit: number = 10): Promise<SearchResult> {
  try {
    const client = getNeynarClient();

    const response = await client.searchUser({ q: query, limit });

    const users: UserProfile[] = response.result.users.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || user.pfp?.url,
      bio: user.profile?.bio?.text,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      powerBadge: user.power_badge || false,
      activeStatus: user.active_status || 'inactive',
    }));

    return {
      users,
      next: response.result.next,
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return { users: [] };
  }
}

/**
 * Get user's recent casts
 */
export async function getRecentCasts(fid: number, limit: number = 10): Promise<Cast[]> {
  try {
    const client = getNeynarClient();

    // Use fetchCastsForUser to get user's casts
    const response = await client.fetchCastsForUser({ fid, limit });

    return response.casts.map((cast: any) => ({
      hash: cast.hash,
      text: cast.text,
      timestamp: cast.timestamp,
      author: {
        fid: cast.author.fid,
        username: cast.author.username,
      },
      reactions: {
        likes_count: cast.reactions?.likes_count || 0,
        recasts_count: cast.reactions?.recasts_count || 0,
      },
      replies: {
        count: cast.replies?.count || 0,
      },
      channel: cast.channel?.id,
      embeds: cast.embeds,
      parent_hash: cast.parent_hash,
    }));
  } catch (error) {
    console.error('Error fetching recent casts:', error);
    return [];
  }
}

/**
 * Get top performing casts
 */
export async function getTopCasts(fid: number, limit: number = 5): Promise<Cast[]> {
  try {
    const casts = await getRecentCasts(fid, 50);

    // Sort by engagement and return top ones
    return casts
      .sort((a, b) => {
        const aEngagement = a.reactions.likes_count + a.reactions.recasts_count + a.replies.count;
        const bEngagement = b.reactions.likes_count + b.reactions.recasts_count + b.replies.count;
        return bEngagement - aEngagement;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top casts:', error);
    return [];
  }
}

/**
 * Get user's channel activity
 */
export async function getChannelActivity(fid: number): Promise<ChannelActivity[]> {
  try {
    const client = getNeynarClient();

    // Get user's channel memberships
    const response = await client.fetchUserChannels({ fid, limit: 20 });

    return response.channels.map((channel: any) => ({
      channelId: channel.id,
      channelName: channel.name || channel.id,
      castCount: 0, // Would need additional API call for cast count
      lastActiveAt: new Date().toISOString(),
      role: channel.role,
    }));
  } catch (error) {
    console.error('Error fetching channel activity:', error);
    return [];
  }
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(fid: number): Promise<EngagementMetrics> {
  try {
    // These metrics would typically come from aggregating cast data
    // For now, returning placeholder data
    const recentCasts = await getRecentCasts(fid, 100);

    const totalLikes = recentCasts.reduce((sum, cast) => sum + cast.reactions.likes_count, 0);
    const totalRecasts = recentCasts.reduce((sum, cast) => sum + cast.reactions.recasts_count, 0);
    const totalReplies = recentCasts.reduce((sum, cast) => sum + cast.replies.count, 0);

    const avgEngagement = recentCasts.length > 0
      ? (totalLikes + totalRecasts + totalReplies) / recentCasts.length
      : 0;

    return {
      totalCasts: recentCasts.length,
      totalReplies,
      totalRecasts,
      totalLikes,
      avgEngagementRate: avgEngagement,
      last7DaysActive: true, // Would calculate from timestamps
      last30DaysActive: true,
    };
  } catch (error) {
    console.error('Error calculating engagement metrics:', error);
    return {
      totalCasts: 0,
      totalReplies: 0,
      totalRecasts: 0,
      totalLikes: 0,
      avgEngagementRate: 0,
      last7DaysActive: false,
      last30DaysActive: false,
    };
  }
}

/**
 * Get growth metrics
 */
export async function getGrowthMetrics(fid: number): Promise<GrowthMetrics> {
  try {
    // These would typically come from historical data
    // For now, returning placeholder data
    return {
      followerGrowth7d: 0,
      followerGrowth30d: 0,
      followingGrowth7d: 0,
      followingGrowth30d: 0,
      followerGrowthRate: 0,
    };
  } catch (error) {
    console.error('Error calculating growth metrics:', error);
    return {
      followerGrowth7d: 0,
      followerGrowth30d: 0,
      followingGrowth7d: 0,
      followingGrowth30d: 0,
      followerGrowthRate: 0,
    };
  }
}

/**
 * Get follower/following lists
 */
export async function getFollowers(fid: number, limit: number = 100, cursor?: string) {
  try {
    const client = getNeynarClient();
    const response = await client.fetchUserFollowers(fid, { limit, cursor });
    return response;
  } catch (error) {
    console.error('Error fetching followers:', error);
    return { users: [] };
  }
}

export async function getFollowing(fid: number, limit: number = 100, cursor?: string) {
  try {
    const client = getNeynarClient();
    const response = await client.fetchUserFollowing(fid, { limit, cursor });
    return response;
  } catch (error) {
    console.error('Error fetching following:', error);
    return { users: [] };
  }
}