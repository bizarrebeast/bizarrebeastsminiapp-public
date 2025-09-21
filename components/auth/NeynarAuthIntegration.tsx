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

      // Get verified addresses
      const verifiedAddresses = user.verified_addresses?.eth_addresses || [];

      // Auto-connect the first verified address as wallet if user doesn't have one
      const currentWallet = store.walletAddress;
      const shouldAutoConnectWallet = !currentWallet && verifiedAddresses.length > 0;

      console.log('🔗 Auto-wallet logic:', {
        currentWallet,
        verifiedAddresses,
        shouldAutoConnect: shouldAutoConnectWallet
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
        verifiedAddresses: verifiedAddresses,
        // Auto-connect wallet if user doesn't have one but has verified addresses
        walletAddress: shouldAutoConnectWallet ? verifiedAddresses[0] : currentWallet,
        walletConnected: shouldAutoConnectWallet ? true : store.walletConnected,
        walletIsVerified: currentWallet ? verifiedAddresses.some(
          (addr: string) => addr.toLowerCase() === currentWallet.toLowerCase()
        ) : shouldAutoConnectWallet
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