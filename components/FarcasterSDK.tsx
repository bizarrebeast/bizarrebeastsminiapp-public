'use client';

import { useEffect } from 'react';
import { forceSDKInit, isSDKReady } from '@/lib/sdk-ultimate';
import { useFarcasterSDK } from '@/contexts/SDKContext';

export function FarcasterSDK() {
  const { setSDKReady } = useFarcasterSDK();

  useEffect(() => {
    // Use the ultimate SDK initialization
    const initializeSDK = async () => {
      try {
        console.log('🎯 FarcasterSDK component using ULTIMATE SDK init...');
        
        // Force initialization multiple times
        await forceSDKInit();
        
        // Check if ready
        const ready = isSDKReady();
        console.log('SDK ready status:', ready);
        
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
    
    // Also initialize after delays as backup
    setTimeout(initializeSDK, 100);
    setTimeout(initializeSDK, 500);
    setTimeout(initializeSDK, 1500);
  }, [setSDKReady]);

  return null; // This component doesn't render anything
}