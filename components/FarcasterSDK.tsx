'use client';

import { useEffect } from 'react';

export function FarcasterSDK() {
  useEffect(() => {
    // Completely non-blocking SDK initialization
    // Use requestIdleCallback or setTimeout to ensure it doesn't block rendering
    const initSDK = () => {
      // Check multiple conditions for Farcaster environment
      const isInFrame = window.self !== window.top;
      const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
      
      // Be more permissive - try to init if any condition is met
      if (!isInFrame && !hasFarcasterUA) {
        console.log('Not in Farcaster environment, skipping SDK init');
        return;
      }
      
      console.log('Farcaster environment detected, scheduling SDK init');
      
      // Schedule SDK init to run when browser is idle or after a delay
      const tryInit = async () => {
        try {
          // Dynamic import to prevent loading issues
          const { default: sdk } = await import('@farcaster/frame-sdk');
          
          // Very short timeout to prevent any hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SDK timeout')), 1000)
          );
          
          const readyPromise = sdk.actions.ready();
          
          await Promise.race([readyPromise, timeoutPromise]);
          console.log('Farcaster SDK ready');
        } catch (error: any) {
          // Silently fail - SDK is optional
          console.log('SDK init skipped:', error?.message || 'Unknown error');
        }
      };
      
      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          tryInit();
        }, { timeout: 3000 });
      } else {
        setTimeout(tryInit, 500);
      }
    };

    // Run after a micro delay to ensure component renders first
    setTimeout(initSDK, 0);
  }, []);

  return null; // This component doesn't render anything
}