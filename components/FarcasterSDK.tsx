'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFarcasterSDK } from '@/contexts/SDKContext';

export function FarcasterSDK() {
  const { setSDKReady } = useFarcasterSDK();

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
          });
        }
        
        // Additional wait to ensure React has finished initial rendering
        // This prevents the race condition where SDK initializes before React is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now call ready - this dismisses the splash screen
        await sdk.actions.ready();
        
        // Mark SDK as ready for the entire app
        setSDKReady(true);
        console.log('✅ Farcaster miniapp SDK initialized successfully');
      } catch (error: any) {
        console.error('❌ Failed to initialize miniapp SDK:', error);
        // Still mark as ready to not block the app if not in miniapp context
        setSDKReady(true);
      }
    };

    initializeSDK();
  }, [setSDKReady]);

  return null; // This component doesn't render anything
}