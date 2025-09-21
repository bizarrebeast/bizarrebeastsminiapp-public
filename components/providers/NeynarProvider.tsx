/**
 * Client-side Neynar Provider wrapper
 * Provides Neynar React SDK context to the application
 */

'use client';

import { NeynarContextProvider, Theme } from "@neynar/react";
import { ReactNode } from "react";

export function NeynarProviderWrapper({ children }: { children: ReactNode }) {
  // Detect if we're in the Farcaster app
  const isFarcasterApp = typeof window !== 'undefined' && (
    window.location.href.includes('farcaster://') ||
    window.parent !== window || // In iframe
    /Farcaster/i.test(navigator.userAgent) // Farcaster user agent
  );

  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Dark,
        // Force mobile flow if in Farcaster app
        forceMobile: isFarcasterApp,
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