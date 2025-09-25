'use client';

import { useState, useEffect } from 'react';
import { web3Service, WalletState } from '@/lib/web3';
import { AccessTier } from '@/lib/empire';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { isInFarcasterMiniapp } from '@/lib/farcaster-miniapp';
import { useBBAuth } from '@/hooks/useBBAuth';

export function useWallet() {
  // Get unified auth state
  const unifiedAuth = useUnifiedAuthStore();
  // Get BB Auth state for Farcaster context
  const bbAuth = useBBAuth();

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    empireTier: AccessTier.NORMIE
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize web3 service
    const init = async () => {
      // Skip initialization in Farcaster miniapp
      const inMiniapp = isInFarcasterMiniapp();
      if (inMiniapp) {
        console.log('📱 In Farcaster miniapp - skipping web3 initialization');
        setIsInitializing(false);

        // Check if using BB Auth (for Farcaster context)
        if (bbAuth.isAuthenticated && bbAuth.wallet) {
          // Use BB Auth's wallet and empire tier
          const tierMapping: { [key: string]: AccessTier } = {
            'BIZARRE': AccessTier.BIZARRE,
            'WEIRDO': AccessTier.WEIRDO,
            'ODDBALL': AccessTier.ODDBALL,
            'MISFIT': AccessTier.MISFIT,
            'NORMIE': AccessTier.NORMIE
          };

          setWalletState({
            isConnected: true,
            address: bbAuth.wallet,
            empireTier: tierMapping[bbAuth.empireTier || 'NORMIE'] || AccessTier.NORMIE
          });
        } else if (unifiedAuth.walletAddress) {
          // Fall back to unified auth
          setWalletState({
            isConnected: true,
            address: unifiedAuth.walletAddress,
            empireTier: unifiedAuth.empireTier as AccessTier || AccessTier.NORMIE
          });
        }
        return;
      }

      // Set a maximum timeout for the entire initialization
      const initTimeout = setTimeout(() => {
        console.warn('Wallet initialization timed out');
        setIsInitializing(false);
        setWalletState(web3Service.getState());
      }, 5000); // 5 second total timeout

      try {
        await web3Service.initialize();

        // Check connection with retry logic but with timeout
        const checkWithRetry = async (retries = 2) => { // Reduced retries
          for (let i = 0; i < retries; i++) {
            await web3Service.checkConnection();
            const state = web3Service.getState();

            // If we got a connection, use it
            if (state.isConnected) {
              setWalletState(state);
              break;
            }

            // Wait before retry (shorter wait)
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            } else {
              // Final attempt failed, just set the state
              setWalletState(state);
            }
          }
        };

        await checkWithRetry();
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
        setWalletState(web3Service.getState());
      } finally {
        clearTimeout(initTimeout);
        setIsInitializing(false);
      }
    };

    init();

    // Subscribe to state changes
    const unsubscribe = web3Service.onStateChange((newState) => {
      setWalletState(newState);
      
      // Update initializing state if needed
      if (isInitializing && newState.isConnected) {
        setIsInitializing(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [bbAuth.isAuthenticated, bbAuth.wallet, bbAuth.empireTier, unifiedAuth.walletAddress, unifiedAuth.empireTier]);

  // Update wallet state when BB Auth empire tier changes
  useEffect(() => {
    const inMiniapp = isInFarcasterMiniapp();
    if (inMiniapp && bbAuth.isAuthenticated && bbAuth.wallet && bbAuth.empireTier) {
      const tierMapping: { [key: string]: AccessTier } = {
        'BIZARRE': AccessTier.BIZARRE,
        'WEIRDO': AccessTier.WEIRDO,
        'ODDBALL': AccessTier.ODDBALL,
        'MISFIT': AccessTier.MISFIT,
        'NORMIE': AccessTier.NORMIE
      };

      setWalletState({
        isConnected: true,
        address: bbAuth.wallet,
        empireTier: tierMapping[bbAuth.empireTier] || AccessTier.NORMIE
      });

      console.log('📱 Updated wallet state with BB Auth empire tier:', bbAuth.empireTier);
    }
  }, [bbAuth.empireTier, bbAuth.wallet, bbAuth.isAuthenticated]);

  const connect = async () => {
    // In miniapp, wallet comes from Farcaster
    const inMiniapp = isInFarcasterMiniapp();
    if (inMiniapp) {
      console.log('📱 In miniapp - wallet will be connected via Farcaster');
      return;
    }

    // Prevent connecting while still initializing
    if (isInitializing) {
      console.log('Wallet still initializing, please wait...');
      return;
    }

    try {
      // Set a timeout for the connection attempt
      const connectPromise = web3Service.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Reset initializing state if it got stuck
      if (isInitializing) {
        setIsInitializing(false);
      }
    }
  };

  const disconnect = async () => {
    const inMiniapp = isInFarcasterMiniapp();
    if (inMiniapp) {
      console.log('📱 In miniapp - clearing wallet state');
      setWalletState({
        isConnected: false,
        address: null,
        empireTier: AccessTier.NORMIE
      });
      return;
    }

    try {
      await web3Service.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const refreshEmpireData = async () => {
    try {
      await web3Service.refreshEmpireData();
    } catch (error) {
      console.error('Failed to refresh Empire data:', error);
    }
  };

  // If Farcaster is connected with a verified address, use that instead
  const isConnectedViaFarcaster = unifiedAuth.farcasterConnected && unifiedAuth.walletAddress;

  return {
    ...walletState,
    // Override with Farcaster verified address if available
    isConnected: walletState.isConnected || isConnectedViaFarcaster,
    address: isConnectedViaFarcaster ? unifiedAuth.walletAddress : walletState.address,
    isInitializing,
    connect,
    disconnect,
    refreshEmpireData,
    formatAddress: web3Service.formatAddress,
    // Add a flag to indicate if connection is via Farcaster
    isViaFarcaster: isConnectedViaFarcaster
  };
}