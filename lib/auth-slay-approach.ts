/**
 * Proof of Concept: Slay to Earn Authentication Approach
 * This demonstrates how the new authentication system would work
 */

import sdk from '@farcaster/miniapp-sdk';

// ============================================
// CLIENT SIDE IMPLEMENTATION
// ============================================

/**
 * Custom fetch wrapper that automatically adds auth headers
 * This replaces all fetch calls in the application
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Check if we're in Farcaster context
  const isInMiniapp = await sdk.isInMiniApp();

  if (isInMiniapp) {
    // Use SDK's quickAuth for automatic token attachment
    // This automatically adds Authorization: Bearer <token>
    return sdk.quickAuth.fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        // Add wallet address if connected
        'X-Wallet-Address': await getConnectedWallet() || '',
      }
    });
  } else {
    // Fallback for non-Farcaster contexts (desktop web, PWA)
    // Get token from Neynar auth if available
    const neynarToken = localStorage.getItem('neynar_auth_token');
    const walletAddress = localStorage.getItem('connected_wallet');

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(neynarToken && { 'Authorization': `Bearer ${neynarToken}` }),
        ...(walletAddress && { 'X-Wallet-Address': walletAddress }),
      }
    });
  }
};

/**
 * Get connected wallet from SDK or provider
 */
export const getConnectedWallet = async (): Promise<string | null> => {
  const isInMiniapp = await sdk.isInMiniApp();

  if (isInMiniapp) {
    try {
      // Get wallet from Farcaster SDK
      const provider = await sdk.wallet.getEthereumProvider();
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (error) {
      console.error('Failed to get wallet from SDK:', error);
      return null;
    }
  } else {
    // Get from regular wallet provider (MetaMask, etc.)
    return localStorage.getItem('connected_wallet');
  }
};

/**
 * Connect wallet using appropriate method
 */
export const connectWallet = async (): Promise<string | null> => {
  const isInMiniapp = await sdk.isInMiniApp();

  if (isInMiniapp) {
    try {
      // Use Farcaster SDK wallet provider
      const provider = await sdk.wallet.getEthereumProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const wallet = accounts[0];

      // Verify wallet is in user's verified addresses
      await verifyWalletOwnership(wallet);

      return wallet;
    } catch (error) {
      console.error('Failed to connect wallet via SDK:', error);
      throw error;
    }
  } else {
    // Use regular wallet connection (implement existing flow)
    // This would trigger MetaMask, WalletConnect, etc.
    throw new Error('Implement regular wallet connection');
  }
};

/**
 * Verify wallet ownership on the client (optional pre-check)
 */
const verifyWalletOwnership = async (wallet: string): Promise<boolean> => {
  const response = await authenticatedFetch('/api/auth/verify-wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet })
  });

  if (!response.ok) {
    throw new Error('Wallet verification failed');
  }

  return true;
};

// ============================================
// SERVER SIDE IMPLEMENTATION (Next.js API Route)
// ============================================

/**
 * Example API route handler with authentication
 */
export async function authenticatedApiHandler(req: Request) {
  // Extract auth token and wallet from headers
  const authHeader = req.headers.get('Authorization');
  const walletAddress = req.headers.get('X-Wallet-Address');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized: No token provided', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the Farcaster token and get user info
    const fcUser = await verifyFarcasterToken(token);

    if (!fcUser) {
      return new Response('Unauthorized: Invalid token', { status: 401 });
    }

    // If wallet address provided, verify it belongs to the user
    if (walletAddress) {
      const isVerified = await verifyWalletBelongsToUser(fcUser.fid, walletAddress);

      if (!isVerified) {
        return new Response('Unauthorized: Wallet not verified for this user', { status: 403 });
      }
    }

    // User is fully authenticated
    const user = {
      fid: fcUser.fid,
      username: fcUser.username,
      displayName: fcUser.display_name,
      wallet: walletAddress,
      verifiedWallets: fcUser.verified_addresses?.eth_addresses || []
    };

    // Continue with request processing
    return new Response(JSON.stringify({ user, message: 'Authenticated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Verify Farcaster token with Neynar API
 */
async function verifyFarcasterToken(token: string) {
  // In production, this would validate the JWT or check with Neynar
  // For now, decode and verify with Neynar API

  try {
    // This is a simplified example - actual implementation would:
    // 1. Decode the JWT to get the FID
    // 2. Verify the signature
    // 3. Check token expiry
    // 4. Fetch user data from Neynar

    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${extractFidFromToken(token)}`, {
      headers: {
        'api_key': process.env.NEYNAR_API_KEY!
      }
    });

    const data = await response.json();
    return data.users?.[0] || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Verify wallet belongs to Farcaster user
 */
async function verifyWalletBelongsToUser(fid: number, wallet: string): Promise<boolean> {
  try {
    // Fetch user's verified addresses from Neynar
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'api_key': process.env.NEYNAR_API_KEY!
      }
    });

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) return false;

    // Check if wallet is in user's verified addresses
    const verifiedWallets = user.verified_addresses?.eth_addresses || [];
    return verifiedWallets.some((addr: string) =>
      addr.toLowerCase() === wallet.toLowerCase()
    );
  } catch (error) {
    console.error('Wallet verification failed:', error);
    return false;
  }
}

/**
 * Helper to extract FID from token (simplified)
 */
function extractFidFromToken(token: string): number {
  // In production, properly decode JWT
  // This is just a placeholder
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.fid;
  } catch {
    return 0;
  }
}

// ============================================
// REACT HOOKS FOR EASY INTEGRATION
// ============================================

/**
 * Custom hook for authenticated requests
 */
export function useAuthenticatedFetch() {
  const makeRequest = async (url: string, options?: RequestInit) => {
    try {
      const response = await authenticatedFetch(url, options);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  };

  return { makeRequest };
}

/**
 * Custom hook for authentication state
 */
export function useSlayAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const isInMiniapp = await sdk.isInMiniApp();

    if (isInMiniapp) {
      // Get context from SDK
      const context = await sdk.context;
      if (context?.user) {
        setUser(context.user);
        setIsAuthenticated(true);

        // Try to get wallet
        const connectedWallet = await getConnectedWallet();
        if (connectedWallet) {
          setWallet(connectedWallet);
        }
      }
    } else {
      // Check for Neynar auth token
      const token = localStorage.getItem('neynar_auth_token');
      if (token) {
        // Verify token with backend
        try {
          const response = await authenticatedFetch('/api/auth/me');
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
          setWallet(userData.wallet);
        } catch (error) {
          console.error('Failed to verify auth:', error);
        }
      }
    }
  };

  const login = async () => {
    const isInMiniapp = await sdk.isInMiniApp();

    if (isInMiniapp) {
      // Already authenticated via SDK
      await checkAuthStatus();
    } else {
      // Trigger Neynar auth flow
      window.location.href = '/api/auth/neynar';
    }
  };

  const connectUserWallet = async () => {
    const address = await connectWallet();
    if (address) {
      setWallet(address);
    }
    return address;
  };

  return {
    isAuthenticated,
    user,
    wallet,
    login,
    connectWallet: connectUserWallet,
    checkAuthStatus
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example: Protected API call in a component
 */
export function ExampleComponent() {
  const { makeRequest } = useAuthenticatedFetch();

  const fetchUserData = async () => {
    try {
      const data = await makeRequest('/api/user/profile');
      console.log('User profile:', data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  return (
    <button onClick={fetchUserData}>
      Fetch Profile (Authenticated)
    </button>
  );
}

/**
 * Example: Auth button component
 */
export function SlayAuthButton() {
  const { isAuthenticated, user, wallet, login, connectWallet } = useSlayAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.username}!</p>
        {wallet ? (
          <p>Wallet: {wallet}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
    );
  }

  return (
    <button onClick={login}>
      Sign In with Farcaster
    </button>
  );
}

// Import for useState/useEffect
import { useState, useEffect } from 'react';