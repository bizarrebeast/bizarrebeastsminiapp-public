'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterSDK() {
  useEffect(() => {
    // Initialize the miniapp SDK and dismiss splash screen
    sdk.actions.ready().then(() => {
      console.log('Farcaster miniapp SDK ready - splash dismissed');
    }).catch((error: any) => {
      console.error('Failed to initialize miniapp SDK:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}