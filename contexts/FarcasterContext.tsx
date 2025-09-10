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
      // First, do immediate detection
      const isInFrame = window.location !== window.parent.location || window.self !== window.top;
      const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
      
      // Set initial state immediately based on basic checks
      if (isInFrame || hasFarcasterUA) {
        setIsInFarcaster(true);
        console.log('Farcaster detected immediately via frame/UA check');
      }
      
      // Then try to get SDK context for additional info
      try {
        // Get context with the new miniapp SDK
        const context = await sdk.context;
        console.log('SDK context received:', context);
        
        if (context) {
          setIsInFarcaster(true);
          if (context.user) {
            setFarcasterUser(context.user);
          }
          console.log('Farcaster confirmed via SDK, platform:', context.client?.platformType || 'unknown');
        }
      } catch (error) {
        console.log('SDK context not available (this is okay):', error);
        // We already set isInFarcaster based on frame/UA detection
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