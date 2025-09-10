// SDK initialization module - runs immediately when imported
import { sdk } from '@farcaster/miniapp-sdk';

let sdkInitialized = false;
let sdkReady = false;
let initPromise: Promise<void> | null = null;

// Initialize SDK immediately
const initializeSDK = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('🚀 Starting early SDK initialization...');
      
      // Don't wait for DOM if we're in a miniapp context
      if (typeof window !== 'undefined') {
        // Call ready immediately to establish connection
        await sdk.actions.ready();
        console.log('✅ SDK ready() called');
        
        // Warm up the SDK with actual calls
        try {
          // Make test calls to ensure SDK is fully operational
          const isInMiniApp = await sdk.isInMiniApp();
          console.log('✅ SDK warmed up, isInMiniApp:', isInMiniApp);
          
          if (isInMiniApp) {
            // Pre-fetch context to cache it
            const context = await sdk.context;
            console.log('✅ SDK context pre-fetched:', context?.client?.platformType);
          }
        } catch (warmupError) {
          console.log('⚠️ SDK warmup failed (non-critical):', warmupError);
        }
        
        sdkReady = true;
        sdkInitialized = true;
        console.log('✅ SDK fully initialized and warmed up');
      }
    } catch (error) {
      console.error('❌ SDK initialization failed:', error);
      // Mark as initialized anyway to not block the app
      sdkInitialized = true;
    }
  })();
  
  return initPromise;
};

// Start initialization immediately
if (typeof window !== 'undefined') {
  initializeSDK();
}

// Retry wrapper for SDK operations
export const withSDKRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delay = 100
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      // Ensure SDK is initialized before operation
      if (!sdkInitialized) {
        await initializeSDK();
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`SDK operation attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export const isSDKReady = () => sdkReady;
export const waitForSDK = () => initPromise || initializeSDK();
export { sdk };