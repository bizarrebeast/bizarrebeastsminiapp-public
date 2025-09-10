'use client';

import { useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';

export function FarcasterSDK() {
  useEffect(() => {
    // Initialize the SDK and call ready when the app is loaded
    const initSDK = async () => {
      try {
        // Initialize the SDK
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized and ready');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    initSDK();
  }, []);

  return null; // This component doesn't render anything
}