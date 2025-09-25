/**
 * BB Auth SDK Integration
 * BizarreBeasts authentication with Farcaster SDK
 * Handles race conditions and retry logic
 */

import sdk from '@farcaster/miniapp-sdk';

// Configuration
const MAX_RETRIES = 10; // 10 seconds total
const RETRY_INTERVAL = 1000; // 1 second between retries

/**
 * Wait for Farcaster context with retries
 * Fixes race condition where SDK isn't ready immediately
 */
export async function waitForFarcasterContext(
  maxRetries = MAX_RETRIES
): Promise<any | null> {
  console.log('⏳ Waiting for Farcaster context...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if in miniapp first
      const isInMiniapp = await sdk.isInMiniApp();

      if (!isInMiniapp) {
        console.log('📱 Not in miniapp context');
        return null;
      }

      // Try to get context
      const context = await sdk.context;

      if (context?.user) {
        console.log('✅ Farcaster context ready:', {
          fid: context.user.fid,
          username: context.user.username,
          attempt: i + 1
        });
        return context;
      }

      console.log(`⏳ Context not ready, retry ${i + 1}/${maxRetries}...`);

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    } catch (error) {
      console.log(`⚠️ Context fetch error on attempt ${i + 1}:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  console.error('❌ Failed to get Farcaster context after', maxRetries, 'attempts');
  return null;
}

/**
 * Wait for wallet provider with retries
 * Must be called AFTER context is established
 */
export async function waitForWalletProvider(
  maxRetries = MAX_RETRIES
): Promise<any | null> {
  console.log('💳 Waiting for wallet provider...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      const provider = await sdk.wallet.getEthereumProvider();

      if (provider) {
        console.log(`✅ Wallet provider ready (attempt ${i + 1})`);
        return provider;
      }

      console.log(`⏳ Provider not ready, retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    } catch (error) {
      console.log(`⚠️ Provider fetch error on attempt ${i + 1}:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  console.error('❌ Failed to get wallet provider after', maxRetries, 'attempts');
  return null;
}

/**
 * Initialize BB Auth with proper sequencing
 * 1. Wait for SDK ready
 * 2. Get context with retries
 * 3. Get wallet provider with retries
 */
export async function initializeBBAuth(): Promise<{
  success: boolean;
  context?: any;
  provider?: any;
  wallet?: string;
  error?: string;
}> {
  try {
    console.log('🚀 Initializing BB Auth...');

    // Check if in miniapp
    const isInMiniapp = await sdk.isInMiniApp();

    if (!isInMiniapp) {
      console.log('🌐 Not in Farcaster miniapp, using fallback auth');
      return { success: false, error: 'Not in miniapp context' };
    }

    // Signal SDK ready
    await sdk.actions.ready();
    console.log('✅ SDK ready signal sent');

    // Step 1: Wait for context (critical - must be first!)
    const context = await waitForFarcasterContext();

    if (!context) {
      return {
        success: false,
        error: 'Failed to get Farcaster context after retries'
      };
    }

    // Step 2: Wait for wallet provider (only after context is ready)
    const provider = await waitForWalletProvider();

    if (!provider) {
      // Wallet provider is optional - auth can work without it
      console.log('⚠️ No wallet provider, continuing without wallet');
      return {
        success: true,
        context,
        provider: null,
        wallet: null
      };
    }

    // Step 3: Try to get connected wallet
    let wallet: string | null = null;
    try {
      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      wallet = accounts?.[0] || null;
      console.log('💳 Connected wallet:', wallet || 'none');
    } catch (error) {
      console.log('⚠️ Could not get wallet accounts:', error);
    }

    return {
      success: true,
      context,
      provider,
      wallet
    };
  } catch (error) {
    console.error('❌ BB Auth initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get auth token from SDK
 * The SDK manages the token internally for quickAuth.fetch
 */
export async function getBBAuthToken(): Promise<string | null> {
  try {
    const isInMiniapp = await sdk.isInMiniApp();

    if (!isInMiniapp) {
      return null;
    }

    // The SDK doesn't expose a direct getToken method
    // But quickAuth.fetch adds it automatically
    // For manual use, we can try to extract from context
    const context = await sdk.context;

    if (!context?.user) {
      return null;
    }

    // Create a pseudo-token with user info
    // In production, the real token is handled by quickAuth.fetch
    const token = btoa(JSON.stringify({
      fid: context.user.fid,
      username: context.user.username,
      timestamp: Date.now()
    }));

    return `fc_${token}`;
  } catch (error) {
    console.error('Failed to get BB auth token:', error);
    return null;
  }
}

/**
 * Request wallet connection with retries
 */
export async function requestWalletConnection(): Promise<string | null> {
  try {
    console.log('🔐 Requesting wallet connection...');

    // Ensure we have context first
    const context = await waitForFarcasterContext();
    if (!context) {
      throw new Error('No Farcaster context available');
    }

    // Get wallet provider with retries
    const provider = await waitForWalletProvider();
    if (!provider) {
      throw new Error('No wallet provider available');
    }

    // Request accounts
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    }) as string[];

    const wallet = accounts?.[0];

    if (!wallet) {
      throw new Error('No wallet returned');
    }

    console.log('✅ Wallet connected:', wallet);
    return wallet;
  } catch (error) {
    console.error('❌ Wallet connection failed:', error);
    throw error;
  }
}

/**
 * Use quickAuth.fetch for authenticated requests
 * This is the recommended approach - let SDK handle the token
 */
export async function bbAuthFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isInMiniapp = await sdk.isInMiniApp();

  if (isInMiniapp) {
    // Use SDK's quickAuth.fetch - it handles the token automatically
    console.log('🔐 Using quickAuth.fetch for:', url);

    // Add wallet header if available
    const wallet = await getCurrentWallet();
    if (wallet) {
      options.headers = {
        ...options.headers,
        'X-Wallet-Address': wallet
      };
    }

    return sdk.quickAuth.fetch(url, options);
  } else {
    // Fallback to regular fetch
    return fetch(url, options);
  }
}

/**
 * Get current connected wallet
 */
async function getCurrentWallet(): Promise<string | null> {
  try {
    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) return null;

    const accounts = await provider.request({
      method: 'eth_accounts'
    }) as string[];

    return accounts?.[0] || null;
  } catch {
    return null;
  }
}