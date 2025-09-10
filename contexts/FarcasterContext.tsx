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
        // Check if SDK is available and we're in a frame/miniapp
        const context = await sdk.context;
        if (context) {
          setIsInFarcaster(true);
          setFarcasterUser(context.user);
        }
      } catch (error) {
        // Not in Farcaster
        setIsInFarcaster(false);
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
    if (isInFarcaster) {
      try {
        // Use Farcaster SDK to open composer
        await sdk.actions.openUrl({
          url: `https://warpcast.com/~/compose?text=${encodeURIComponent(
            text || 'Check out my BizarreBeasts meme!'
          )}&embeds[]=${encodeURIComponent(imageUrl)}`,
        });
      } catch (error) {
        console.error('Failed to share via Farcaster SDK:', error);
        // Fallback to window.location
        window.location.href = `https://warpcast.com/~/compose?text=${encodeURIComponent(
          text || 'Check out my BizarreBeasts meme!'
        )}`;
      }
    } else {
      // Regular browser - open in new tab
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(
          text || 'Check out my BizarreBeasts meme!'
        )}&embeds[]=${encodeURIComponent(imageUrl)}`,
        '_blank'
      );
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