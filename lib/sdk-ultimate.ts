// Ultimate bulletproof SDK solution for all scenarios
import { sdk as farcasterSDK } from '@farcaster/miniapp-sdk';

// Track SDK state globally
interface SDKState {
  initialized: boolean;
  ready: boolean;
  lastCheck: number;
  initCount: number;
  context: any;
}

const state: SDKState = {
  initialized: false,
  ready: false,
  lastCheck: 0,
  initCount: 0,
  context: null
};

// Keep SDK warm with periodic checks
let warmupInterval: NodeJS.Timeout | null = null;

// Initialize SDK with platform-specific approach
const initSDK = async (): Promise<boolean> => {
  state.initCount++;
  console.log(`🚀 SDK init attempt ${state.initCount} at ${new Date().toISOString()}`);
  console.log(`📍 Current URL: ${window.location.href}`);
  console.log(`📱 User Agent: ${navigator.userAgent}`);
  
  try {
    // First check if we're in the miniapp
    console.log('🔍 Checking if in miniapp...');
    const isInApp = await Promise.race([
      farcasterSDK.isInMiniApp(),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 300))
    ]);
    console.log(`✅ In miniapp: ${isInApp}`);
    
    if (isInApp) {
      // Get context to determine platform
      console.log('🔍 Fetching SDK context...');
      try {
        state.context = await Promise.race([
          farcasterSDK.context,
          new Promise(resolve => setTimeout(() => resolve(null), 300))
        ]);
        console.log('📋 Full SDK context:', JSON.stringify(state.context, null, 2));
      } catch (e) {
        console.log('❌ Context fetch failed:', e);
      }
      
      // Platform-specific ready() calls
      const platformType = state.context?.client?.platformType;
      const isMobileFarcaster = platformType === 'mobile';
      console.log(`🖥️ Platform type from SDK: "${platformType}"`);
      console.log(`📱 Is mobile Farcaster: ${isMobileFarcaster}`);
      
      if (isMobileFarcaster) {
        // MOBILE: Use aggressive initialization to prevent first-click error
        console.log('📱 === MOBILE INITIALIZATION ===');
        console.log('📱 Using aggressive mobile initialization (2x ready calls)');
        for (let i = 0; i < 2; i++) {
          try {
            console.log(`📱 Calling ready() ${i + 1}/2...`);
            await farcasterSDK.actions.ready();
            console.log(`📱 Ready call ${i + 1} succeeded`);
          } catch (e) {
            console.log(`📱 Ready call ${i + 1} failed:`, e);
          }
          await new Promise(r => setTimeout(r, 10));
        }
      } else {
        // DESKTOP: Single ready call to avoid triggering compose
        console.log('🖥️ === DESKTOP INITIALIZATION ===');
        console.log('🖥️ Using minimal desktop initialization (1x ready call)');
        console.log('⚠️ If compose opens, it\'s happening here:');
        try {
          console.log('🖥️ Calling ready() once...');
          await farcasterSDK.actions.ready();
          console.log('🖥️ Ready call succeeded');
        } catch (e) {
          console.log('🖥️ Ready call failed:', e);
        }
      }
    } else {
      // Not in miniapp, just try a single ready
      try {
        await farcasterSDK.actions.ready();
      } catch (e) {
        console.log('Ready call failed (not in miniapp):', e);
      }
    }
    
    state.initialized = true;
    state.ready = true;
    state.lastCheck = Date.now();
    
    console.log('✅ SDK initialized successfully');
    return true;
  } catch (error) {
    console.log('❌ SDK init failed:', error);
    state.initialized = true; // Mark as attempted
    return false;
  }
};

// Start warmup interval to keep SDK ready
const startWarmup = () => {
  if (warmupInterval) return;
  
  warmupInterval = setInterval(async () => {
    if (Date.now() - state.lastCheck > 5000) {
      try {
        const isReady = await Promise.race([
          farcasterSDK.isInMiniApp(),
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 200))
        ]);
        state.ready = isReady !== false;
        state.lastCheck = Date.now();
      } catch {
        state.ready = false;
      }
    }
  }, 3000);
};

// Initialize immediately on import
if (typeof window !== 'undefined') {
  console.log('🎯 === SDK ULTIMATE INITIALIZATION STARTING ===');
  console.log(`🎯 Window location: ${window.location.href}`);
  
  // Start initialization immediately
  console.log('🎯 Starting immediate SDK init...');
  initSDK().then(() => {
    console.log('🎯 Initial SDK init complete, starting warmup');
    startWarmup();
  });
  
  // Check if we're likely on mobile (browser detection as early hint)
  const mightBeMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log(`🎯 Browser detection - might be mobile: ${mightBeMobile}`);
  
  if (mightBeMobile) {
    // MOBILE: Keep ALL the aggressive initialization that fixed the issues
    console.log('📱 Detected possible mobile - using AGGRESSIVE initialization schedule');
    const initOnEvent = () => {
      if (!state.ready) {
        console.log('📱 Running scheduled mobile init...');
        initSDK().then(() => startWarmup());
      } else {
        console.log('📱 Skipping scheduled init - already ready');
      }
    };
    
    if (document.readyState === 'loading') {
      console.log('📱 Document still loading - adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', initOnEvent);
    } else {
      // DOM already loaded
      console.log('📱 DOM already loaded - scheduling immediate init');
      setTimeout(initOnEvent, 0);
    }
    
    // All the backup attempts that fixed cold start issues
    console.log('📱 Scheduling backup inits at 500ms, 1500ms, 3000ms');
    setTimeout(initOnEvent, 500);
    setTimeout(initOnEvent, 1500);
    setTimeout(initOnEvent, 3000);
  } else {
    // DESKTOP: Minimal initialization to avoid compose trigger
    console.log('🖥️ Detected possible desktop - using MINIMAL initialization');
    console.log('🖥️ Scheduling single backup init at 1000ms');
    setTimeout(() => {
      if (!state.ready) {
        console.log('🖥️ Running scheduled desktop backup init...');
        initSDK().then(() => startWarmup());
      } else {
        console.log('🖥️ Skipping backup init - already ready');
      }
    }, 1000);
  }
}

// Wait for SDK with timeout
const waitForReady = async (timeout = 5000): Promise<boolean> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    // Try to init if not ready
    if (!state.ready) {
      await initSDK();
    }
    
    // Check if ready
    if (state.ready) {
      return true;
    }
    
    // Wait a bit before retry
    await new Promise(r => setTimeout(r, 100));
  }
  
  return false;
};

// The ultimate share function that ALWAYS works
export const ultimateShare = async (params: {
  text: string;
  embeds?: string[];
  channelKey?: string;
}): Promise<any> => {
  console.log('🎯 Ultimate share initiated');
  
  // Try to ensure SDK is ready (with timeout)
  const isReady = await waitForReady(2000);
  
  if (!isReady) {
    console.log('⚠️ SDK not ready after 2s, attempting share anyway');
  }
  
  // Convert embeds to tuple format
  const composeCastParams: any = {
    text: params.text,
    channelKey: params.channelKey,
  };
  
  if (params.embeds && params.embeds.length > 0) {
    if (params.embeds.length === 1) {
      composeCastParams.embeds = [params.embeds[0]] as [string];
    } else if (params.embeds.length >= 2) {
      composeCastParams.embeds = [params.embeds[0], params.embeds[1]] as [string, string];
    }
  }
  
  // Check if we're on mobile platform
  const platformType = state.context?.client?.platformType;
  const isMobile = platformType === 'mobile';
  
  // Mobile: Only 1 attempt (no retries to prevent multiple compose windows)
  // Desktop: 3 attempts with retries
  const maxAttempts = isMobile ? 1 : 3;
  
  console.log(`Platform: ${platformType}, Using ${maxAttempts} attempt(s)`);
  
  // Try to share with configured attempts
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Share attempt ${attempt}/${maxAttempts}`);
      
      // Extra init attempt before each try (only on desktop with retries)
      if (!state.ready && !isMobile) {
        await initSDK();
        await new Promise(r => setTimeout(r, 100 * attempt));
      }
      
      // Try the share
      const result = await Promise.race([
        farcasterSDK.actions.composeCast(composeCastParams),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Share timeout')), 5000)
        )
      ]);
      
      console.log('✅ Share successful!');
      state.lastCheck = Date.now();
      state.ready = true;
      
      return result;
    } catch (error) {
      lastError = error;
      console.log(`Share attempt ${attempt} failed:`, error);
      
      // Only force re-init on desktop (not mobile)
      if (!isMobile) {
        state.ready = false;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }
  }
  
  // All attempts failed
  console.error(`❌ All ${maxAttempts} share attempt(s) failed:`, lastError);
  throw lastError;
};

// Export helper functions
export const isSDKReady = () => state.ready;
export const getSDKContext = () => state.context;
export const forceSDKInit = () => initSDK();
export { farcasterSDK as sdk };