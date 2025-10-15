/**
 * Enhanced Farcaster miniapp detection
 * Uses multiple signals to determine if we're in a Farcaster context
 */

import sdk from '@farcaster/miniapp-sdk';

// Cache detection result for performance
let detectionCache: {
  isInMiniapp: boolean;
  timestamp: number;
  method: string;
} | null = null;

const CACHE_DURATION = 5000; // 5 seconds

/**
 * Detect if we're in a Farcaster miniapp using multiple methods
 * This is more reliable than just sdk.isInMiniApp()
 */
export async function detectFarcasterContext(): Promise<{
  isInMiniapp: boolean;
  method: string;
  context?: any;
}> {
  // Check cache first
  if (detectionCache && Date.now() - detectionCache.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached detection:', detectionCache);
    return detectionCache;
  }

  console.log('🔍 Starting Farcaster detection...');

  // Method 1: Check User Agent (most reliable for Farcaster app)
  const userAgent = navigator.userAgent.toLowerCase();
  const isWarpcastUA = userAgent.includes('warpcast');
  if (isWarpcastUA) {
    console.log('✅ Detected Farcaster via User Agent: warpcast');
    const result = { isInMiniapp: true, method: 'user-agent' };
    detectionCache = { ...result, timestamp: Date.now() };
    return result;
  }

  // Method 2: Check URL parameters (Farcaster adds specific params)
  const urlParams = new URLSearchParams(window.location.search);
  const hasFarcasterParams = urlParams.has('fid') || urlParams.has('fname') || urlParams.has('fc_frame');
  if (hasFarcasterParams) {
    console.log('✅ Detected Farcaster via URL params');
    const result = { isInMiniapp: true, method: 'url-params' };
    detectionCache = { ...result, timestamp: Date.now() };
    return result;
  }

  // Method 3: Check parent window (for iframe embeds)
  try {
    if (window.parent !== window && window.parent.location.hostname.includes('warpcast')) {
      console.log('✅ Detected Farcaster via parent window');
      const result = { isInMiniapp: true, method: 'parent-window' };
      detectionCache = { ...result, timestamp: Date.now() };
      return result;
    }
  } catch (e) {
    // Cross-origin error is expected and ignored
  }

  // Method 4: Try SDK detection (with longer timeout)
  try {
    console.log('🔧 Trying SDK detection...');
    const sdkDetection = await Promise.race([
      sdk.isInMiniApp(),
      new Promise<boolean>(resolve => setTimeout(() => {
        console.log('⏱️ SDK detection timeout');
        resolve(false);
      }, 1000)) // Increased timeout to 1 second
    ]);

    if (sdkDetection) {
      console.log('✅ SDK detected miniapp context');

      // Try to get context as well
      let context = null;
      try {
        context = await Promise.race([
          sdk.context,
          new Promise(resolve => setTimeout(() => resolve(null), 500))
        ]);
      } catch (e) {
        console.log('Context fetch failed:', e);
      }

      const result = { isInMiniapp: true, method: 'sdk', context };
      detectionCache = { ...result, timestamp: Date.now() };
      return result;
    }
  } catch (error) {
    console.log('SDK detection error:', error);
  }

  // Method 5: Check for Farcaster-specific window properties
  if ((window as any).__FARCASTER__ || (window as any).farcaster) {
    console.log('✅ Detected Farcaster via window properties');
    const result = { isInMiniapp: true, method: 'window-props' };
    detectionCache = { ...result, timestamp: Date.now() };
    return result;
  }

  // Not in Farcaster miniapp
  console.log('❌ Not in Farcaster miniapp context');
  const result = { isInMiniapp: false, method: 'none' };
  detectionCache = { ...result, timestamp: Date.now() };
  return result;
}

/**
 * Clear the detection cache (useful after navigation or context changes)
 */
export function clearDetectionCache() {
  detectionCache = null;
}

/**
 * Get cached detection result without re-checking
 */
export function getCachedDetection(): typeof detectionCache {
  return detectionCache;
}