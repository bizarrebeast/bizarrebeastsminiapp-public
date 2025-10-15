/**
 * BB Auth - Authenticated Fetch Implementation
 * BizarreBeasts authentication system
 * Uses Farcaster SDK quickAuth in miniapp context
 * Falls back to standard auth headers for web
 */

import sdk from '@farcaster/miniapp-sdk';
import { detectFarcasterContext } from './farcaster-detection';

// Type definitions
export interface AuthHeaders {
  'Authorization'?: string;
  'X-Wallet-Address'?: string;
  [key: string]: string | undefined;
}

/**
 * Get the current connected wallet address
 */
export async function getConnectedWallet(): Promise<string | null> {
  try {
    const detection = await detectFarcasterContext();
    console.log('🔍 [getConnectedWallet] Detection:', detection);

    if (detection.isInMiniapp) {
      // PRIORITY 1: Try unified auth store first (persisted wallet from FarcasterSDKSync)
      console.log('🔍 [getConnectedWallet] PRIORITY 1: Checking unified auth store...');
      const { useUnifiedAuthStore } = await import('@/store/useUnifiedAuthStore');
      const storeWallet = useUnifiedAuthStore.getState().walletAddress;
      console.log('🔍 [getConnectedWallet] Store wallet:', storeWallet);

      if (storeWallet) {
        console.log('✅ [getConnectedWallet] PRIORITY 1 WIN: Using wallet from unified auth store:', storeWallet);
        return storeWallet;
      }

      // PRIORITY 2: Get wallet from Farcaster SDK
      console.log('🔍 [getConnectedWallet] PRIORITY 2: Checking Farcaster SDK provider...');
      const provider = await sdk.wallet.getEthereumProvider();
      console.log('🔍 [getConnectedWallet] SDK provider available:', !!provider);

      if (!provider) {
        console.log('⚠️ [getConnectedWallet] No wallet provider available');
        return null;
      }

      // Check for existing connection first
      const accounts = await provider.request({
        method: 'eth_accounts'
      }) as string[];
      console.log('🔍 [getConnectedWallet] SDK accounts:', accounts);

      if (accounts && accounts.length > 0) {
        console.log('✅ [getConnectedWallet] PRIORITY 2 WIN: Found connected wallet from SDK:', accounts[0]);
        return accounts[0];
      }

      console.log('ℹ️ [getConnectedWallet] No wallet connected yet');
      return null;
    } else {
      // Get from localStorage for web context
      console.log('🌐 [getConnectedWallet] Not in miniapp, checking localStorage...');
      const wallet = localStorage.getItem('connected_wallet');
      console.log('🌐 [getConnectedWallet] Web wallet:', wallet || 'none');
      return wallet;
    }
  } catch (error) {
    console.error('❌ [getConnectedWallet] Failed to get connected wallet:', error);
    return null;
  }
}

/**
 * Request wallet connection
 */
export async function requestWalletConnection(): Promise<string | null> {
  try {
    const detection = await detectFarcasterContext();

    if (detection.isInMiniapp) {
      console.log('📱 Requesting wallet connection in miniapp...');
      const provider = await sdk.wallet.getEthereumProvider();

      if (!provider) {
        throw new Error('No wallet provider available');
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts && accounts.length > 0) {
        console.log('✅ Wallet connected:', accounts[0]);
        return accounts[0];
      }

      throw new Error('No accounts returned');
    } else {
      // Handle web wallet connection
      throw new Error('Web wallet connection not implemented yet');
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Authenticated fetch wrapper using BB Auth
 * Automatically adds auth headers based on context
 * Uses quickAuth.fetch in miniapp for proper token handling
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Use enhanced detection
    const detection = await detectFarcasterContext();
    console.log(`🔐 BB Auth fetch to ${url}, in miniapp: ${detection.isInMiniapp} (${detection.method})`);

    if (detection.isInMiniapp) {
      // CRITICAL: Use SDK's quickAuth.fetch - it handles the token automatically
      // This is what the Slay developer uses and it works
      console.log('📱 [authenticatedFetch] Using quickAuth.fetch (BB Auth)');

      // Get wallet to add as header
      const walletAddress = await getConnectedWallet();
      console.log('🔍 [authenticatedFetch] Wallet for header:', walletAddress);

      // Add wallet header if connected
      const headers: HeadersInit = {
        ...options.headers,
        ...(walletAddress && { 'X-Wallet-Address': walletAddress })
      };

      console.log('📤 [authenticatedFetch] Final headers:', {
        ...headers,
        hasWalletHeader: !!walletAddress,
        walletValue: walletAddress
      });

      // quickAuth.fetch automatically adds the Authorization header with FC token
      return await sdk.quickAuth.fetch(url, {
        ...options,
        headers
      });
    } else {
      // Fallback for non-Farcaster contexts
      console.log('🌐 Using standard fetch with manual auth headers');

      // Get auth token from storage (Neynar or session)
      const authToken = localStorage.getItem('neynar_auth_token') ||
                       localStorage.getItem('bb_session_token');

      const walletAddress = localStorage.getItem('connected_wallet');

      // Build headers
      const headers: HeadersInit = {
        ...options.headers,
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(walletAddress && { 'X-Wallet-Address': walletAddress })
      };

      return fetch(url, {
        ...options,
        headers
      });
    }
  } catch (error) {
    console.error('BB Auth fetch error:', error);
    throw error;
  }
}

/**
 * Verify authentication with backend
 */
export async function verifyAuth(): Promise<{
  success: boolean;
  user?: any;
  sessionToken?: string;
}> {
  try {
    console.log('🔐 Verifying authentication...');

    const response = await authenticatedFetch('/api/auth/v2/verify', {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Auth verification failed:', error);
      return { success: false };
    }

    const data = await response.json();
    console.log('✅ Auth verified:', data.user?.username);

    // Store session token if provided
    if (data.sessionToken) {
      const detection = await detectFarcasterContext();
      if (!detection.isInMiniapp) {
        // Store for web context
        localStorage.setItem('bb_session_token', data.sessionToken);
      }

      // Also create session cookie
      await createSession(data.sessionToken);
    }

    return {
      success: true,
      user: data.user,
      sessionToken: data.sessionToken
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false };
  }
}

/**
 * Create session with backend
 */
export async function createSession(sessionToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/v2/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken })
    });

    if (!response.ok) {
      console.error('Failed to create session');
      return false;
    }

    console.log('✅ Session created successfully');
    return true;
  } catch (error) {
    console.error('Session creation error:', error);
    return false;
  }
}

/**
 * Check current session status
 */
export async function checkSession(): Promise<{
  authenticated: boolean;
  session?: any;
}> {
  try {
    const response = await fetch('/api/auth/v2/session');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Session check error:', error);
    return { authenticated: false };
  }
}

/**
 * End session (logout)
 */
export async function endSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/v2/session', {
      method: 'DELETE'
    });

    if (!response.ok) {
      console.error('Failed to end session');
      return false;
    }

    // Clear local storage
    localStorage.removeItem('bb_session_token');
    localStorage.removeItem('connected_wallet');

    console.log('✅ Session ended successfully');
    return true;
  } catch (error) {
    console.error('Session end error:', error);
    return false;
  }
}

/**
 * Initialize authentication
 * Call this on app startup
 */
export async function initializeAuth(): Promise<{
  isAuthenticated: boolean;
  user?: any;
  wallet?: string;
}> {
  try {
    console.log('🚀 Initializing authentication...');

    const detection = await detectFarcasterContext();

    if (detection.isInMiniapp) {
      console.log('📱 In Farcaster miniapp - using SDK auth');

      // SDK will handle auth automatically
      // Just verify with backend
      const verification = await verifyAuth();

      if (verification.success) {
        // Try to get wallet
        const wallet = await getConnectedWallet();

        return {
          isAuthenticated: true,
          user: verification.user,
          wallet: wallet || undefined
        };
      }
    } else {
      console.log('🌐 In web context - checking session');

      // Check existing session
      const session = await checkSession();

      if (session.authenticated) {
        return {
          isAuthenticated: true,
          user: session.session,
          wallet: session.session?.wallet
        };
      }
    }

    return { isAuthenticated: false };
  } catch (error) {
    console.error('Auth initialization error:', error);
    return { isAuthenticated: false };
  }
}