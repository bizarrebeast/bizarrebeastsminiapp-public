'use client';

import React, { useEffect, useState } from 'react';
import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit';

const config = {
  // Production configuration for AuthKit
  relay: 'https://relay.farcaster.xyz',
  domain: 'bbapp.bizarrebeasts.io',
  siweUri: 'https://bbapp.bizarrebeasts.io',
  rpcUrl: 'https://mainnet.optimism.io', // Using Optimism for auth (Farcaster native)
  version: 'v1',
};

interface AuthKitProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthKitProviderWrapper({ children }: AuthKitProviderWrapperProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMiniapp, setIsMiniapp] = useState(false);

  useEffect(() => {
    // Detect if we're in a miniapp context
    const checkEnvironment = async () => {
      // Check if we're in Farcaster SDK miniapp context (mobile)
      const inMobileMiniapp = typeof window !== 'undefined' &&
        (window as any).farcaster !== undefined;

      // Check if we're in Farcaster desktop (warpcast.com iframe)
      const inFarcasterDesktop = typeof window !== 'undefined' &&
        (window.location.href.includes('warpcast.com') ||
         window.parent !== window); // In iframe

      // Check if desktop browser (not mobile miniapp but could be Farcaster desktop)
      const isDesktopBrowser = typeof window !== 'undefined' &&
        window.innerWidth > 768 &&
        !inMobileMiniapp &&
        !('ontouchstart' in window);

      setIsMiniapp(inMobileMiniapp);
      setIsDesktop(isDesktopBrowser || inFarcasterDesktop);

      console.log('🔐 AuthKit Environment Detection:', {
        isDesktop: isDesktopBrowser || inFarcasterDesktop,
        isMiniapp: inMobileMiniapp,
        inFarcasterDesktop,
        screenWidth: window.innerWidth,
        url: window.location.href,
        inIframe: window.parent !== window
      });
    };

    checkEnvironment();

    // Re-check on resize
    const handleResize = () => {
      const isDesktopBrowser = window.innerWidth > 768 && !('ontouchstart' in window);
      setIsDesktop(isDesktopBrowser);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only wrap with AuthKit provider on desktop browsers
  // Mobile/miniapp will use existing Neynar auth
  if (isDesktop && !isMiniapp) {
    return (
      <FarcasterAuthKitProvider config={config}>
        {children}
      </FarcasterAuthKitProvider>
    );
  }

  // For mobile/miniapp, pass through without AuthKit
  return <>{children}</>;
}