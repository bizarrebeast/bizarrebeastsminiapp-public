'use client';

import { useEffect } from 'react';
import { waitForSDK } from '@/lib/sdk-init';
import { useFarcasterSDK } from '@/contexts/SDKContext';

export function FarcasterSDK() {
  const { setSDKReady } = useFarcasterSDK();

  useEffect(() => {
    // SDK initialization already started in sdk-init.ts
    // Just wait for it to complete and update the context
    waitForSDK().then(() => {
      setSDKReady(true);
      console.log('✅ SDK ready state updated in context');
    }).catch((error) => {
      console.error('❌ SDK initialization error:', error);
      // Still mark as ready to not block the app
      setSDKReady(true);
    });
  }, [setSDKReady]);

  return null; // This component doesn't render anything
}