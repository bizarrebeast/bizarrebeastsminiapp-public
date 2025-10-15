'use client';

import { useEffect, useRef } from 'react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useFarcasterSDK } from '@/contexts/SDKContext';
import { sdk } from '@/lib/sdk-init';

export function FarcasterSDKSync() {
  // Use selectors to prevent unnecessary re-renders
  const farcasterFid = useUnifiedAuthStore(state => state.farcasterFid);
  const farcasterUsername = useUnifiedAuthStore(state => state.farcasterUsername);
  const farcasterConnected = useUnifiedAuthStore(state => state.farcasterConnected);
  const walletAddress = useUnifiedAuthStore(state => state.walletAddress);

  const { isSDKReady } = useFarcasterSDK();
  const lastSyncedFid = useRef<number | null>(null);
  const lastSyncedUsername = useRef<string | null>(null);
  const syncAttempts = useRef(0);
  const isSyncing = useRef(false);
  const hasCompletedInitialSync = useRef(false);

  useEffect(() => {
    // Allow re-sync if store has been cleared (auth regression fix)
    const storeIsEmpty = !farcasterConnected || !farcasterFid;

    // Only run sync once per app session when SDK becomes ready, unless store is empty
    if (!isSDKReady || (hasCompletedInitialSync.current && !storeIsEmpty)) return;

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

        // For bizarrebeast, always sync to ensure correct data
        const isBizarreBeast = sdkUser.fid === 357897;

        // Check if we've already synced this exact user AND the store has the data
        const alreadySynced = !isBizarreBeast &&
            lastSyncedFid.current === sdkUser.fid &&
            lastSyncedUsername.current === sdkUser.username &&
            farcasterFid === sdkUser.fid &&
            farcasterUsername === sdkUser.username &&
            farcasterConnected;

        if (alreadySynced) {
          console.log('🔄 Already synced this user, skipping');
          hasCompletedInitialSync.current = true;
          return;
        }

        // Log why we're syncing
        if (!farcasterConnected) {
          console.log('🔄 Syncing because Farcaster not connected in store');
        } else if (farcasterFid !== sdkUser.fid) {
          console.log('🔄 Syncing because FID mismatch:', farcasterFid, 'vs', sdkUser.fid);
        } else if (farcasterUsername !== sdkUser.username) {
          console.log('🔄 Syncing because username mismatch:', farcasterUsername, 'vs', sdkUser.username);
        }

        // For bizarrebeast, force sync if data is wrong
        if (isBizarreBeast && farcasterUsername !== 'bizarrebeast') {
          console.log('🔥 FORCE SYNC for @bizarrebeast - incorrect username detected');
        }

        console.log('🔄 SDK User Data Available:', {
          fid: sdkUser.fid,
          username: sdkUser.username,
          displayName: sdkUser.displayName,
          pfpUrl: sdkUser.pfpUrl
        });

        // Check if we need to sync (data mismatch or "testuser" detected)
        const needsSync =
          farcasterFid !== sdkUser.fid ||
          farcasterUsername !== sdkUser.username ||
          farcasterUsername === 'testuser' ||
          !farcasterConnected ||
          (isBizarreBeast && (!walletAddress || walletAddress !== '0x3FDD6aFEd7a19990632468c7102219d051E685dB'));

        if (needsSync) {
          isSyncing.current = true;
          console.log('⚡ SYNCING FROM SDK - Fixing authentication data');

          // Fetch verified addresses from Neynar API
          let verifiedAddresses: string[] = [];
          try {
            const neynarResponse = await fetch(`/api/auth/v2/user?fid=${sdkUser.fid}`);
            if (neynarResponse.ok) {
              const neynarData = await neynarResponse.json();
              verifiedAddresses = neynarData.user?.verified_addresses?.eth_addresses || [];
              console.log('✅ Fetched verified addresses for sync:', verifiedAddresses);
            }
          } catch (error) {
            console.log('Failed to fetch verified addresses during sync:', error);
          }

          // Universal wallet detection for all users (including @bizarrebeast)
          let walletToConnect = walletAddress;

          console.log('🔍 [FarcasterSDKSync] Starting wallet detection...');
          console.log('🔍 [FarcasterSDKSync] Current store wallet:', walletAddress);
          console.log('🔍 [FarcasterSDKSync] Verified addresses:', verifiedAddresses);
          console.log('🔍 [FarcasterSDKSync] User FID:', sdkUser.fid);

          // PRIORITY 1: Try to get wallet from SDK first (the actual connected wallet)
          console.log('🔍 [FarcasterSDKSync] PRIORITY 1: Checking SDK provider...');
          try {
            const sdk = await import('@farcaster/miniapp-sdk');
            const provider = await sdk.default.wallet.getEthereumProvider();
            console.log('🔍 [FarcasterSDKSync] SDK provider available:', !!provider);

            if (provider) {
              const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
              console.log('🔍 [FarcasterSDKSync] SDK accounts:', accounts);

              if (accounts && accounts[0]) {
                walletToConnect = accounts[0];
                console.log('✅ [FarcasterSDKSync] PRIORITY 1 WIN: Using wallet from SDK provider:', walletToConnect);
              } else {
                console.log('⚠️ [FarcasterSDKSync] SDK provider returned no accounts');
              }
            } else {
              console.log('⚠️ [FarcasterSDKSync] SDK provider is null/undefined');
            }
          } catch (error) {
            console.error('❌ [FarcasterSDKSync] Could not get wallet from SDK:', error);
          }

          // PRIORITY 2: Fall back to first verified address if SDK fails
          if (!walletToConnect && verifiedAddresses.length > 0) {
            console.log('🔍 [FarcasterSDKSync] PRIORITY 2: SDK failed, using first verified address');
            walletToConnect = verifiedAddresses[0];
            console.log('✅ [FarcasterSDKSync] PRIORITY 2 WIN: Using first verified address:', walletToConnect);
          }

          // PRIORITY 3: Use existing wallet from store if nothing else works
          if (!walletToConnect) {
            console.log('🔍 [FarcasterSDKSync] PRIORITY 3: Using existing wallet from store');
            walletToConnect = walletAddress;
            console.log('✅ [FarcasterSDKSync] PRIORITY 3 WIN: Using existing wallet from store:', walletToConnect);
          }

          console.log('🏁 [FarcasterSDKSync] FINAL WALLET SELECTED:', walletToConnect);

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
          lastSyncedUsername.current = sdkUser.username || null;
          syncAttempts.current = 0;
          isSyncing.current = false;
          hasCompletedInitialSync.current = true;

          console.log('✅ SDK sync complete - Fixed user data:', {
            username: sdkUser.username,
            fid: sdkUser.fid,
            wallet: walletToConnect
          });

          // If this is bizarrebeast, ensure database has correct data
          if (sdkUser.fid === 357897) {
            try {
              // Update both Farcaster data and wallet
              await fetch('/api/auth/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  farcasterFid: sdkUser.fid,
                  farcasterData: {
                    username: sdkUser.username,
                    displayName: sdkUser.displayName || sdkUser.username,
                    pfpUrl: sdkUser.pfpUrl,
                    bio: '',
                    verifiedAddresses: [walletToConnect!].filter(Boolean)
                  },
                  walletAddress: walletToConnect,
                  skipRefresh: true // Don't trigger refreshProfile
                })
              });
              console.log('✅ Updated complete profile in database for @bizarrebeast');
            } catch (error) {
              console.error('Failed to update profile in database:', error);
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

    // Don't run periodic syncs - causes render loops
    // Re-run if SDK ready state changes OR if store is cleared (auth regression fix)
  }, [isSDKReady, farcasterConnected, farcasterFid]); // Re-sync if store clears

  return null;
}