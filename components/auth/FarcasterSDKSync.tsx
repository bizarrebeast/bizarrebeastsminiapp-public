'use client';

import { useEffect, useRef } from 'react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useFarcasterSDK } from '@/contexts/SDKContext';
import { sdk } from '@/lib/sdk-init';

export function FarcasterSDKSync() {
  const store = useUnifiedAuthStore();
  const { isSDKReady } = useFarcasterSDK();
  const lastSyncedFid = useRef<number | null>(null);
  const lastSyncedUsername = useRef<string | null>(null);
  const syncAttempts = useRef(0);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!isSDKReady) return;

    const syncFromSDK = async () => {
      // Prevent concurrent syncs
      if (isSyncing.current) {
        console.log('🔄 Sync already in progress, skipping');
        return;
      }

      try {
        // Check if we're in a miniapp
        const isInMiniApp = await sdk.isInMiniApp();
        if (!isInMiniApp) {
          console.log('📱 Not in Farcaster miniapp, skipping SDK sync');
          return;
        }

        // Get SDK context with user data
        const context = await sdk.context;
        const sdkUser = context?.user;

        if (!sdkUser) {
          console.log('📱 No SDK user available');
          return;
        }

        // Check if we've already synced this exact user
        if (lastSyncedFid.current === sdkUser.fid &&
            lastSyncedUsername.current === sdkUser.username &&
            store.farcasterUsername !== 'testuser') {
          console.log('🔄 Already synced this user, skipping');
          return;
        }

        console.log('🔄 SDK User Data Available:', {
          fid: sdkUser.fid,
          username: sdkUser.username,
          displayName: sdkUser.displayName,
          pfpUrl: sdkUser.pfpUrl
        });

        // Check if we need to sync (data mismatch or "testuser" detected)
        const needsSync =
          store.farcasterFid !== sdkUser.fid ||
          store.farcasterUsername !== sdkUser.username ||
          store.farcasterUsername === 'testuser' ||
          (!store.walletAddress && sdkUser.fid === 357897);

        if (needsSync) {
          isSyncing.current = true;
          console.log('⚡ SYNCING FROM SDK - Fixing authentication data');

          // SDK doesn't provide verifiedAddresses in the same way
          // For now, we'll use an empty array and rely on known wallet for specific users
          const verifiedAddresses: string[] = [];

          // For @bizarrebeast, use the specific wallet
          let walletToConnect = store.walletAddress;
          if (sdkUser.fid === 357897 && !walletToConnect) {
            // Use the known wallet for @bizarrebeast
            walletToConnect = '0x3FDD6aFEd7a19990632468c7102219d051E685dB';
            console.log('🎯 Using known wallet for @bizarrebeast');
          } else if (!walletToConnect && verifiedAddresses.length > 0) {
            walletToConnect = verifiedAddresses[0];
            console.log('🔗 Using first verified address:', walletToConnect);
          }

          // Direct state update to fix the data
          useUnifiedAuthStore.setState({
            farcasterFid: sdkUser.fid,
            farcasterUsername: sdkUser.username,
            farcasterDisplayName: sdkUser.displayName || sdkUser.username,
            farcasterPfpUrl: sdkUser.pfpUrl || '',
            farcasterConnected: true,
            verifiedAddresses: verifiedAddresses,
            walletAddress: walletToConnect,
            walletConnected: !!walletToConnect,
            walletIsVerified: walletToConnect && verifiedAddresses.length > 0 ?
              verifiedAddresses.some((addr: string) =>
                addr.toLowerCase() === walletToConnect!.toLowerCase()
              ) : false,
            identitiesLinked: !!walletToConnect
          });

          lastSyncedFid.current = sdkUser.fid;
          lastSyncedUsername.current = sdkUser.username;
          syncAttempts.current = 0;
          isSyncing.current = false;

          console.log('✅ SDK sync complete - Fixed user data:', {
            username: sdkUser.username,
            fid: sdkUser.fid,
            wallet: walletToConnect
          });

          // If this is bizarrebeast and we set the wallet, also update the database
          if (sdkUser.fid === 357897 && walletToConnect) {
            try {
              await fetch('/api/auth/update-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  farcasterFid: sdkUser.fid,
                  walletAddress: walletToConnect
                })
              });
              console.log('✅ Updated wallet in database');
            } catch (error) {
              console.error('Failed to update wallet in database:', error);
            }
          }
        }
      } catch (error) {
        console.error('SDK sync error:', error);
        isSyncing.current = false;
        syncAttempts.current++;

        // Retry a few times if it fails
        if (syncAttempts.current < 3) {
          setTimeout(() => syncFromSDK(), 1000 * syncAttempts.current);
        }
      }
    };

    // Run sync immediately
    syncFromSDK();

    // Only run a delayed sync if username is still 'testuser'
    if (store.farcasterUsername === 'testuser') {
      const timeout = setTimeout(syncFromSDK, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isSDKReady]); // Only re-run when SDK becomes ready

  return null;
}