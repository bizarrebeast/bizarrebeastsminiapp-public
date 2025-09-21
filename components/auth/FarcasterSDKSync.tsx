'use client';

import { useEffect, useRef } from 'react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useFarcasterSDK } from '@/contexts/SDKContext';
import { sdk } from '@/lib/sdk-init';

export function FarcasterSDKSync() {
  const store = useUnifiedAuthStore();
  const { isSDKReady } = useFarcasterSDK();
  const lastSyncedFid = useRef<number | null>(null);
  const syncAttempts = useRef(0);

  useEffect(() => {
    if (!isSDKReady) return;

    const syncFromSDK = async () => {
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

        console.log('🔄 SDK User Data Available:', {
          fid: sdkUser.fid,
          username: sdkUser.username,
          displayName: sdkUser.displayName,
          verifiedAddresses: sdkUser.verifiedAddresses
        });

        // Check if we need to sync (data mismatch or "testuser" detected)
        const needsSync =
          store.farcasterFid !== sdkUser.fid ||
          store.farcasterUsername !== sdkUser.username ||
          store.farcasterUsername === 'testuser' ||
          (!store.walletAddress && sdkUser.verifiedAddresses?.length > 0);

        if (needsSync) {
          console.log('⚡ SYNCING FROM SDK - Fixing authentication data');

          const verifiedAddresses = sdkUser.verifiedAddresses || [];

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
          syncAttempts.current = 0;

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
        syncAttempts.current++;

        // Retry a few times if it fails
        if (syncAttempts.current < 3) {
          setTimeout(() => syncFromSDK(), 1000 * syncAttempts.current);
        }
      }
    };

    // Run sync immediately and after a short delay to catch any timing issues
    syncFromSDK();
    const timeout = setTimeout(syncFromSDK, 2000);

    return () => clearTimeout(timeout);
  }, [isSDKReady, store.farcasterUsername, store.farcasterFid, store.walletAddress]);

  return null;
}