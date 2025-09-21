'use client';

import React, { useEffect, useState } from 'react';
import { NeynarAuthButton, useNeynarContext } from '@neynar/react';
import sdk from '@farcaster/miniapp-sdk';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

export function FarcasterAwareAuthButton() {
  const [isInFarcasterApp, setIsInFarcasterApp] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { user: neynarUser } = useNeynarContext();
  const { connectFarcaster, farcasterConnected } = useUnifiedAuthStore();

  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        // Get the context which includes user info
        const context = await sdk.context;
        console.log('Farcaster SDK Context:', context);

        if (context?.user) {
          // We're inside the Farcaster app and have user data
          setIsInFarcasterApp(true);
          setFarcasterUser(context.user);

          // Auto-connect with the Farcaster user data
          if (!farcasterConnected) {
            connectFarcaster({
              fid: context.user.fid,
              username: context.user.username,
              display_name: context.user.displayName,
              displayName: context.user.displayName,
              pfp_url: context.user.pfpUrl,
              pfpUrl: context.user.pfpUrl,
              bio: '',
              verified_addresses: {},
              verifiedAddresses: []
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.log('Not in Farcaster app or SDK error:', error);
        setIsInFarcasterApp(false);
        setLoading(false);
      }
    };

    checkFarcasterContext();
  }, [connectFarcaster, farcasterConnected]);

  // If we're in the Farcaster app and have user data, show connected state
  if (isInFarcasterApp && farcasterUser) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-900 text-white rounded-lg">
        {farcasterUser.pfpUrl && (
          <img
            src={farcasterUser.pfpUrl}
            alt={farcasterUser.username}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span>@{farcasterUser.username}</span>
        <span className="text-xs text-purple-300">(via Farcaster)</span>
      </div>
    );
  }

  // If we have Neynar user, show them
  if (neynarUser) {
    return (
      <div className="flex items-center gap-2">
        <NeynarAuthButton />
      </div>
    );
  }

  // Otherwise show the login button
  // But if we're loading, show loading state
  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg">
        Loading...
      </div>
    );
  }

  // Show regular Neynar auth button for non-Farcaster contexts
  return <NeynarAuthButton />;
}