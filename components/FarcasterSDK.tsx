'use client';

import { useEffect } from 'react';
import { waitForSDK, ensureSDKReady } from '@/lib/sdk-wrapper';
import { useFarcasterSDK } from '@/contexts/SDKContext';

export function FarcasterSDK() {
  const { setSDKReady } = useFarcasterSDK();

  useEffect(() => {
    // Aggressively ensure SDK is ready with multiple initialization attempts
    const initializeSDK = async () => {
      try {
        console.log('🎯 FarcasterSDK component ensuring SDK is ready...');
        
        // Multiple initialization attempts
        await ensureSDKReady();
        await waitForSDK();
        
        setSDKReady(true);
        console.log('✅ SDK ready state updated in context');
      } catch (error) {
        console.error('❌ SDK initialization error:', error);
        // Still mark as ready to not block the app
        setSDKReady(true);
      }
    };
    
    // Initialize immediately
    initializeSDK();
    
    // Also initialize after a short delay as backup
    setTimeout(initializeSDK, 500);
  }, [setSDKReady]);

  return null; // This component doesn't render anything
}