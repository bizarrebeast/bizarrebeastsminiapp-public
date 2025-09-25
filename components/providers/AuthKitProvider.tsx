'use client';

import React, { useEffect, useState } from 'react';
import { AuthKitProvider as FarcasterAuthKitProvider, createConfig } from '@farcaster/auth-kit';

const config = createConfig({
  // Production configuration for AuthKit
  relay: 'https://relay.farcaster.xyz',
  domain: 'bbapp.bizarrebeasts.io',
  siweUri: 'https://bbapp.bizarrebeasts.io',
  rpcUrl: 'https://mainnet.optimism.io', // Using Optimism for auth (Farcaster native)
  version: 'v1',
});

interface AuthKitProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthKitProviderWrapper({ children }: AuthKitProviderWrapperProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMiniapp, setIsMiniapp] = useState(false);

  useEffect(() => {
    // Detect if we're in a miniapp context
    const checkEnvironment = async () => {
      // Check if we're in Farcaster miniapp SDK context
      const hasFarcasterSDK = typeof window !== 'undefined' &&
        window.location.href.includes('farcaster.xyz') ||
        window.location.href.includes('warpcast.com');

      // Check if desktop (wider screen, not in miniapp)
      const isDesktopBrowser = typeof window !== 'undefined' &&
        window.innerWidth > 768 &&
        !hasFarcasterSDK &&
        !('ontouchstart' in window);

      setIsMiniapp(hasFarcasterSDK);
      setIsDesktop(isDesktopBrowser);

      console.log('🔐 AuthKit Environment Detection:', {
        isDesktop: isDesktopBrowser,
        isMiniapp: hasFarcasterSDK,
        screenWidth: window.innerWidth,
        userAgent: navigator.userAgent
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