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
    // Check if we're in Farcaster using official SDK methods
    const checkEnvironment = async () => {
      try {
        // Use official SDK detection method
        const inMiniApp = await sdk.isInMiniApp();
        console.log('SDK isInMiniApp():', inMiniApp);
        
        if (inMiniApp) {
          setIsInFarcaster(true);
          
          // Get context for platform and user info
          const context = await sdk.context;
          console.log('SDK context:', context);
          
          if (context) {
            if (context.user) {
              setFarcasterUser(context.user);
            }
            
            // Check platform type for mobile/desktop
            const platformType = context.client?.platformType;
            console.log('Platform type:', platformType);
            
            // Set mobile state based on platform
            if (platformType === 'mobile') {
              setIsMobile(true);
            }
          }
        } else {
          // Fallback detection for browsers
          const isInFrame = window.location !== window.parent.location || window.self !== window.top;
          const hasFarcasterUA = /Farcaster/i.test(navigator.userAgent);
          
          if (isInFrame || hasFarcasterUA) {
            setIsInFarcaster(true);
            console.log('Farcaster detected via fallback');
          }
        }
      } catch (error) {
        console.log('Environment check error:', error);
        // Fallback to frame detection
        const isInFrame = window.self !== window.top;
        if (isInFrame) {
          setIsInFarcaster(true);
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