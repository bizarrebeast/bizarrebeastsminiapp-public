/**
 * Client-side Neynar Provider wrapper
 * Provides Neynar React SDK context to the application
 */

'use client';

import { NeynarContextProvider, Theme } from "@neynar/react";
import { ReactNode } from "react";

export function NeynarProviderWrapper({ children }: { children: ReactNode }) {
  // Better detection for Farcaster app and mobile
  const isMobile = typeof window !== 'undefined' && (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0)
  );

  const isFarcasterApp = typeof window !== 'undefined' && (
    window.location.href.includes('farcaster://') ||
    window.location.href.includes('fc://') ||
    /Farcaster/i.test(navigator.userAgent) ||
    // Check if we're in an iframe with farcaster in the URL
    (window.parent !== window && (
      document.referrer.includes('farcaster') ||
      window.location.hostname.includes('farcaster')
    ))
  );

  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('Neynar Provider Detection:', {
      isMobile,
      isFarcasterApp,
      userAgent: navigator.userAgent,
      href: window.location.href,
      referrer: document.referrer,
      isIframe: window.parent !== window
    });
  }

  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Dark,
        eventsCallbacks: {
          onAuthSuccess: () => {
            console.log("Neynar auth successful");
            // Close popup if in popup mode
            if (window.opener) {
              window.close();
            }
          },
          onSignout: () => {
            console.log("User signed out");
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  );
}