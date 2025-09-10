'use client';

import { useEffect } from 'react';

export function FarcasterSDK() {
  useEffect(() => {
    // Only initialize SDK if we're actually in Farcaster
    const initSDK = async () => {
      // Check if we're in an iframe (likely Farcaster)
      const isInFrame = window.self !== window.top;
      
      if (!isInFrame) {
        console.log('Not in Farcaster frame, skipping SDK init');
        return;
      }
      
      try {
        // Dynamic import to prevent loading issues
        const { default: sdk } = await import('@farcaster/frame-sdk');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SDK ready timeout')), 5000)
        );
        
        const readyPromise = sdk.actions.ready();
        
        await Promise.race([readyPromise, timeoutPromise]);
        console.log('Farcaster SDK initialized and ready');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // Don't block the app if SDK fails
      }
    };

    // Delay SDK init slightly to let app render first
    setTimeout(initSDK, 100);
  }, []);

  return null; // This component doesn't render anything
}