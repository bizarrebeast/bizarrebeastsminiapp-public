'use client';

import { useEffect } from 'react';

export function FarcasterSDK() {
  useEffect(() => {
    // Initialize SDK with a balanced approach
    const initSDK = async () => {
      try {
        // Quick environment check
        const isInFrame = window.self !== window.top;
        const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
        
        // Try to initialize if we might be in Farcaster
        if (isInFrame || hasFarcasterUA) {
          console.log('Farcaster environment detected, initializing SDK');
          
          // Import SDK dynamically
          const { default: sdk } = await import('@farcaster/frame-sdk');
          
          // Call ready() to dismiss splash screen
          // This is CRITICAL - without this, splash screen stays forever
          await sdk.actions.ready();
          console.log('Farcaster SDK ready - splash screen dismissed');
        } else {
          console.log('Not in Farcaster, skipping SDK');
        }
      } catch (error: any) {
        // Log error but don't block app
        console.error('SDK initialization error:', error?.message || error);
        
        // Try a fallback approach if the first attempt fails
        try {
          const { default: sdk } = await import('@farcaster/frame-sdk');
          // Try calling ready without await in case it's blocking
          sdk.actions.ready().catch((e: any) => {
            console.log('SDK ready failed (non-critical):', e?.message);
          });
        } catch (fallbackError) {
          console.log('SDK fallback also failed (app will continue)');
        }
      }
    };

    // Run immediately to dismiss splash ASAP
    initSDK();
  }, []);

  return null; // This component doesn't render anything
}