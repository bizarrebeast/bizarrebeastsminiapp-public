'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';

interface FarcasterContextType {
  isInFarcaster: boolean;
  isMobile: boolean;
  farcasterUser: any;
  shareImage: (imageUrl: string, text?: string) => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInFarcaster: false,
  isMobile: false,
  farcasterUser: null,
  shareImage: async () => {},
});

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);

  useEffect(() => {
    // Check if we're in Farcaster
    const checkEnvironment = async () => {
      try {
        // Multiple detection methods for reliability
        const isInFrame = window.location !== window.parent.location || window.self !== window.top;
        const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
        
        // Check if SDK is available and we're in a frame/miniapp
        // Add timeout to prevent hanging
        const contextPromise = sdk.context;
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(null), 2000)
        );
        
        const context = await Promise.race([contextPromise, timeoutPromise]) as any;
        if (context && context.client) {
          setIsInFarcaster(true);
          setFarcasterUser(context.user);
          console.log('Farcaster detected via SDK, platform:', context.client.platformType);
        } else if (isInFrame || hasFarcasterUA) {
          // Fallback detection
          setIsInFarcaster(true);
          console.log('Farcaster detected via frame/UA');
        }
      } catch (error) {
        // Additional fallback checks
        const isInFrame = window.location !== window.parent.location;
        const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
        
        if (isInFrame || hasFarcasterUA) {
          setIsInFarcaster(true);
          console.log('Farcaster detected via fallback');
        } else {
          setIsInFarcaster(false);
        }
      }

      // Check if mobile
      const checkMobile = () => {
        const userAgent = navigator.userAgent || navigator.vendor;
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
        const isMobileWidth = window.innerWidth < 768;
        setIsMobile(isMobileDevice || isMobileWidth);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    };

    checkEnvironment();
  }, []);

  const shareImage = async (imageUrl: string, text?: string) => {
    const shareText = text || `...\n\nCheck out BizarreBeasts ($BB) and hold 25M tokens to join /bizarrebeasts! 🚀 👹\n\nCC @bizarrebeast\n\nhttps://bbapp.bizarrebeasts.io`;
    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}&channelKey=bizarrebeasts`;
    
    if (isInFarcaster) {
      try {
        // Try using SDK's openUrl first
        if (sdk.actions && sdk.actions.openUrl) {
          await sdk.actions.openUrl(shareUrl);
          console.log('Shared via SDK openUrl');
        } else {
          // Fallback to direct navigation in Farcaster
          window.location.href = shareUrl;
          console.log('Shared via location.href');
        }
      } catch (error) {
        console.error('Failed to share via Farcaster SDK:', error);
        // Fallback to window.location
        window.location.href = shareUrl;
      }
    } else if (isMobile) {
      // Mobile browser - navigate directly
      window.location.href = shareUrl;
    } else {
      // Desktop browser - open in new tab
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <FarcasterContext.Provider
      value={{
        isInFarcaster,
        isMobile,
        farcasterUser,
        shareImage,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);