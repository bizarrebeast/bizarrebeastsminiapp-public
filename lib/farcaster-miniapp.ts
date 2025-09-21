/**
 * Farcaster Miniapp Detection and Utilities
 * Handles detection of Farcaster miniapp context and auto-authentication
 */

import sdk from '@farcaster/miniapp-sdk';

/**
 * Detects if the app is running inside a Farcaster miniapp context
 * Note: This is synchronous for compatibility, checks cached state
 */
export const isInFarcasterMiniapp = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // Check if we have a cached miniapp state
    // The SDK initialization will set this
    const cachedState = (window as any).__farcasterMiniappState;
    if (cachedState !== undefined) {
      return cachedState;
    }

    // Default to false if not yet initialized
    return false;
  } catch (error) {
    console.error('Error detecting Farcaster miniapp context:', error);
    return false;
  }
};

/**
 * Async version of miniapp detection that properly awaits SDK
 */
export const checkIsInFarcasterMiniapp = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    // Use official Farcaster SDK detection
    const inMiniapp = await sdk.isInMiniApp();

    // Get context if in miniapp
    let contextData = null;
    if (inMiniapp) {
      contextData = await sdk.context;
    }

    // Log detection result
    console.log('🔍 Farcaster Miniapp Detection (async):', {
      isInMiniApp: inMiniapp,
      context: contextData,
      user: contextData?.user
    });

    // Cache the result for synchronous checks
    (window as any).__farcasterMiniappState = inMiniapp;

    return inMiniapp;
  } catch (error) {
    console.error('Error detecting Farcaster miniapp context:', error);
    (window as any).__farcasterMiniappState = false;
    return false;
  }
};

/**
 * Initialize the Farcaster SDK when in miniapp
 */
export const initializeFarcasterSDK = async () => {
  if (typeof window === 'undefined') return;

  try {
    // Check and cache miniapp state
    const inMiniapp = await checkIsInFarcasterMiniapp();

    if (inMiniapp) {
      // Signal that the app is ready
      await sdk.actions.ready();
      console.log('✅ Farcaster SDK initialized');

      // Get initial context
      const context = await sdk.context;
      console.log('📱 Farcaster context:', {
        user: context?.user,
        client: context?.client
      });

      return context;
    }
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
  }

  return null;
};

/**
 * Gets Farcaster user data from SDK context or URL parameters
 */
export const getFarcasterDataFromUrl = async () => {
  if (typeof window === 'undefined') return null;

  try {
    // First try to get from SDK context
    const isInMiniApp = await sdk.isInMiniApp();
    if (isInMiniApp) {
      const context = await sdk.context;
      if (context?.user) {
        return {
          fid: context.user.fid,
          fname: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          walletAddress: (context.user as any)?.verifiedAddresses?.ethereum?.[0]
        };
      }
    }
  } catch (error) {
    console.error('Error getting data from SDK:', error);
  }

  // Fallback to URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  return {
    fid: urlParams.get('fid'),
    fname: urlParams.get('fname'),
    displayName: urlParams.get('display_name'),
    pfpUrl: urlParams.get('pfp_url'),
    walletAddress: urlParams.get('wallet') || urlParams.get('address')
  };
};

/**
 * Checks if we should auto-login with Farcaster
 */
export const shouldAutoLoginWithFarcaster = async (): Promise<boolean> => {
  // Auto-login if:
  // 1. We're in a Farcaster miniapp
  // 2. We have Farcaster data in context or URL

  try {
    const isInMiniApp = await sdk.isInMiniApp();
    if (isInMiniApp) {
      const context = await sdk.context;
      return !!context?.user;
    }
  } catch (error) {
    console.error('Error checking SDK for auto-login:', error);
  }

  // Fallback to URL check
  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlData = !!(urlParams.get('fid') || urlParams.get('fname'));

  return hasUrlData;
};

/**
 * Gets the appropriate storage mechanism for the context
 */
export const getStorageForContext = () => {
  if (isInFarcasterMiniapp()) {
    // In miniapp, prefer sessionStorage as it's more reliable
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  }
  // In regular browser, use localStorage
  return typeof window !== 'undefined' ? window.localStorage : null;
};

/**
 * Posts a message to the parent Farcaster frame
 */
export const postToFarcasterParent = async (message: any) => {
  try {
    // Use SDK if available
    const inMiniApp = await sdk.isInMiniApp();
    if (inMiniApp && sdk.actions) {
      // SDK handles messaging internally
      console.log('📤 Using SDK for parent messaging:', message);
      return;
    }
  } catch (error) {
    console.error('SDK messaging failed:', error);
  }

  // Fallback to direct postMessage
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
};

/**
 * Requests wallet connection from Farcaster parent
 */
export const requestFarcasterWallet = async () => {
  try {
    // Use SDK wallet actions if available
    const inMiniApp = await sdk.isInMiniApp();
    if (inMiniApp && sdk.wallet) {
      console.log('📱 Requesting wallet via SDK');
      const result = await sdk.wallet.ethProvider.request({
        method: 'eth_requestAccounts'
      });
      return result;
    }
  } catch (error) {
    console.error('SDK wallet request failed:', error);
  }

  // Fallback to manual request
  postToFarcasterParent({
    type: 'fc:frame:wallet_request',
    data: {
      chain: 'base',
      method: 'eth_requestAccounts'
    }
  });
};

/**
 * Listen for Farcaster parent messages
 */
export const listenToFarcasterMessages = async (callback: (data: any) => void) => {
  if (typeof window === 'undefined') return () => {};

  try {
    // If SDK is available, it handles messages internally
    const inMiniApp = await sdk.isInMiniApp();
    if (inMiniApp) {
      console.log('📨 SDK is handling Farcaster messages');
      // SDK automatically handles wallet events
      return () => {};
    }
  } catch (error) {
    console.error('SDK message handling check failed:', error);
  }

  // Fallback to manual message handling
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type?.startsWith('fc:')) {
      console.log('📨 Received Farcaster message:', event.data);
      callback(event.data);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
};