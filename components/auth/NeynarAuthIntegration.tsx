'use client';

import { useEffect, useRef } from 'react';
import { useNeynarContext } from '@neynar/react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

export function NeynarAuthIntegration() {
  const { user } = useNeynarContext();
  const store = useUnifiedAuthStore();
  const lastSyncedFid = useRef<number | null>(null);

  useEffect(() => {
    // Enhanced logging for debugging
    console.log('🔍 Neynar Auth Integration Check:', {
      hasUser: !!user,
      farcasterConnected: store.farcasterConnected,
      currentStoreFid: store.farcasterFid,
      currentStoreUsername: store.farcasterUsername,
      currentStorePfp: store.farcasterPfpUrl,
      userData: user ? {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        hasProfile: !!user.profile,
        hasBio: !!user.profile?.bio
      } : null
    });

    if (!user) {
      console.log('❌ No Neynar user detected');
      return;
    }

    // ALWAYS sync if data doesn't match
    const dataMatches = store.farcasterUsername === user.username &&
                       store.farcasterPfpUrl === user.pfp_url &&
                       store.farcasterFid === user.fid;

    if (!dataMatches) {
      console.log('🔄 FORCE SYNC - Data mismatch detected!', {
        stored: { username: store.farcasterUsername, fid: store.farcasterFid, pfp: store.farcasterPfpUrl },
        actual: { username: user.username, fid: user.fid, pfp: user.pfp_url }
      });

      // Directly update store state WITHOUT calling connectFarcaster
      // This avoids database calls and refreshProfile that might overwrite with stale data
      useUnifiedAuthStore.setState({
        farcasterFid: user.fid,
        farcasterUsername: user.username,
        farcasterDisplayName: user.display_name || user.username,
        farcasterPfpUrl: user.pfp_url || '',
        farcasterBio: user.profile?.bio?.text || '',
        farcasterConnected: true,
        verifiedAddresses: user.verified_addresses?.eth_addresses || []
      });

      lastSyncedFid.current = user.fid;

      console.log('✅ Force sync complete with correct data:', {
        username: user.username,
        pfp_url: user.pfp_url || ''
      });
    } else {
      console.log('✅ Data already matches - no sync needed');
    }
  }, [user, store.farcasterConnected, store.farcasterFid, store.farcasterPfpUrl, store.farcasterUsername]);

  return null;
}