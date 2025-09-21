/**
 * Client-side Neynar Provider wrapper
 * Provides Neynar React SDK context to the application
 */

'use client';

import { NeynarContextProvider, Theme } from "@neynar/react";
import { ReactNode } from "react";

export function NeynarProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Dark,
        eventsCallbacks: {
          onAuthSuccess: () => {
            console.log("Neynar auth successful");
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