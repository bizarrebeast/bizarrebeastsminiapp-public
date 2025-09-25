/**
 * Authentication Verification Service
 * Implements the Slay to Earn approach for secure auth
 * Phase 1: Backend Infrastructure
 */

import { getNeynarClient } from '@/lib/neynar';

// Types
export interface AuthToken {
  fid: number;
  username: string;
  expiresAt: number;
}

export interface VerifiedUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  verifiedAddresses: string[];
  wallet?: string; // Currently connected wallet
  isWalletVerified: boolean;
}

export interface VerificationResult {
  success: boolean;
  user?: VerifiedUser;
  error?: string;
}

/**
 * Verify Farcaster authentication token
 * This will validate the token from quickAuth.fetch()
 */
export async function verifyFarcasterToken(token: string): Promise<AuthToken | null> {
  try {
    // Handle different token formats
    let actualToken = token;

    // Remove Bearer prefix if present
    if (token && token.startsWith('Bearer ')) {
      actualToken = token.replace('Bearer ', '');
    }

    // Handle Farcaster SDK token format (fc_ prefix)
    if (actualToken.startsWith('fc_')) {
      try {
        // Farcaster SDK uses base64 encoded JSON with fc_ prefix
        const base64Data = actualToken.replace('fc_', '');
        const payload = JSON.parse(
          Buffer.from(base64Data, 'base64').toString('utf-8')
        );

        // Validate required fields
        if (!payload.fid) {
          console.error('FC token missing FID');
          return null;
        }

        // Check timestamp (if present)
        if (payload.timestamp) {
          // Allow tokens that are less than 24 hours old
          const age = Date.now() - payload.timestamp;
          if (age > 24 * 60 * 60 * 1000) {
            console.error('FC token too old');
            return null;
          }
        }

        return {
          fid: payload.fid,
          username: payload.username || `user${payload.fid}`,
          expiresAt: payload.timestamp ? payload.timestamp + (24 * 60 * 60 * 1000) : Date.now() + 3600000
        };
      } catch (error) {
        console.error('Failed to decode FC token:', error);
      }
    }

    // Try standard JWT format
    try {
      const parts = actualToken.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Validate required fields
      if (!payload.fid) {
        console.error('Token missing FID');
        return null;
      }

      // Check expiry
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.error('Token expired');
        return null;
      }

      return {
        fid: payload.fid,
        username: payload.username || `user${payload.fid}`,
        expiresAt: payload.exp ? payload.exp * 1000 : Date.now() + 3600000
      };
    } catch (error) {
      console.error('Failed to decode as JWT:', error);
      return null;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Fetch user data from Neynar API
 */
export async function fetchUserFromNeynar(fid: number): Promise<any | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'api_key': process.env.NEYNAR_API_KEY!,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Neynar API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.users?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch user from Neynar:', error);
    return null;
  }
}

/**
 * Verify wallet ownership for a Farcaster user
 */
export async function verifyWalletOwnership(
  fid: number,
  walletAddress: string
): Promise<boolean> {
  try {
    if (!walletAddress) return false;

    // Fetch user's verified addresses from Neynar
    const user = await fetchUserFromNeynar(fid);

    if (!user) {
      console.error('User not found');
      return false;
    }

    // Check verified addresses
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];

    // Case-insensitive comparison
    const normalizedWallet = walletAddress.toLowerCase();
    const isVerified = verifiedAddresses.some(
      (addr: string) => addr.toLowerCase() === normalizedWallet
    );

    console.log('Wallet verification:', {
      fid,
      wallet: walletAddress,
      verifiedAddresses,
      isVerified
    });

    return isVerified;
  } catch (error) {
    console.error('Wallet verification error:', error);
    return false;
  }
}

/**
 * Complete authentication verification
 * Validates token AND wallet ownership
 */
export async function verifyCompleteAuth(
  authToken: string | null,
  walletAddress: string | null
): Promise<VerificationResult> {
  try {
    // Step 1: Verify auth token
    if (!authToken) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    const tokenData = await verifyFarcasterToken(authToken);
    if (!tokenData) {
      return {
        success: false,
        error: 'Invalid or expired authentication token'
      };
    }

    // Step 2: Fetch user data
    const userData = await fetchUserFromNeynar(tokenData.fid);
    if (!userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Step 3: Verify wallet if provided
    let isWalletVerified = false;
    if (walletAddress) {
      isWalletVerified = await verifyWalletOwnership(tokenData.fid, walletAddress);
    }

    // Build verified user object
    const verifiedUser: VerifiedUser = {
      fid: userData.fid,
      username: userData.username,
      displayName: userData.display_name,
      pfpUrl: userData.pfp_url,
      verifiedAddresses: userData.verified_addresses?.eth_addresses || [],
      wallet: walletAddress || undefined,
      isWalletVerified
    };

    return {
      success: true,
      user: verifiedUser
    };
  } catch (error) {
    console.error('Complete auth verification error:', error);
    return {
      success: false,
      error: 'Authentication verification failed'
    };
  }
}

/**
 * Extract auth headers from request
 */
export function extractAuthHeaders(request: Request): {
  authToken: string | null;
  walletAddress: string | null;
} {
  const authToken = request.headers.get('Authorization');
  const walletAddress = request.headers.get('X-Wallet-Address');

  return {
    authToken,
    walletAddress
  };
}

/**
 * Create a session token for verified users
 */
export function createSessionToken(user: VerifiedUser): string {
  // In production, use proper JWT library
  const payload = {
    fid: user.fid,
    username: user.username,
    wallet: user.wallet,
    isWalletVerified: user.isWalletVerified,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  // Simple base64 encoding for now
  // TODO: Use proper JWT signing in production
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): any | null {
  try {
    // Simple base64 decoding for now
    // TODO: Use proper JWT verification in production
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Check expiry
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Session token verification error:', error);
    return null;
  }
}