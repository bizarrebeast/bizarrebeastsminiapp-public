'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

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
        const context = await sdk.context;
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
    
    if (isInFarcaster) {
      try {
        // Use composeCast for native Farcaster sharing
        const result = await sdk.actions.composeCast({
          text: shareText,
          embeds: [imageUrl],
          channelKey: 'bizarrebeasts'
        });
        
        if (result?.cast) {
          console.log('Cast created successfully:', result.cast.hash);
        } else {
          console.log('User cancelled cast');
        }
      } catch (error) {
        console.error('Failed to compose cast:', error);
        // Fallback to URL method
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}&channelKey=bizarrebeasts`;
        window.location.href = shareUrl;
      }
    } else {
      // Outside Farcaster - use URL method
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}&channelKey=bizarrebeasts`;
      
      if (isMobile) {
        // Mobile browser - navigate directly
        window.location.href = shareUrl;
      } else {
        // Desktop browser - open in new tab
        window.open(shareUrl, '_blank');
      }
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