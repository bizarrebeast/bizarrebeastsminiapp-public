'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { web3Service, WalletState } from '@/lib/web3';
import { AccessTier } from '@/lib/empire';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { isInFarcasterMiniapp } from '@/lib/farcaster-miniapp';
import { useBBAuth } from '@/hooks/useBBAuth';

export function useWallet() {
  // Get unified auth state - use selectors to prevent unnecessary re-renders
  const farcasterConnected = useUnifiedAuthStore(state => state.farcasterConnected);
  const unifiedWalletAddress = useUnifiedAuthStore(state => state.walletAddress);
  const unifiedEmpireTier = useUnifiedAuthStore(state => state.empireTier);

  // Get BB Auth state for Farcaster context
  const bbAuth = useBBAuth();

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    empireTier: AccessTier.NORMIE
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Track initialization to prevent loops
  const hasInitializedRef = useRef(false);
  const renderCountRef = useRef(0);

  // Debug excessive renders
  renderCountRef.current++;
  if (renderCountRef.current > 20) {
    console.warn(`[useWallet] Excessive renders detected: ${renderCountRef.current}`);
  }

  useEffect(() => {
    // Prevent re-initialization if already done
    if (hasInitializedRef.current) {
      console.log('[useWallet] Skipping re-initialization, already initialized');
      return;
    }

    // Initialize web3 service
    const init = async () => {
      hasInitializedRef.current = true;

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

          console.log('📱 Setting wallet state from BB Auth:', {
            wallet: bbAuth.wallet,
            empireTier: bbAuth.empireTier,
            empireRank: bbAuth.empireRank
          });

          setWalletState({
            isConnected: true,
            address: bbAuth.wallet,
            empireTier: tierMapping[bbAuth.empireTier || 'NORMIE'] || AccessTier.NORMIE
          });
        } else if (unifiedWalletAddress) {
          // Fall back to unified auth
          setWalletState({
            isConnected: true,
            address: unifiedWalletAddress,
            empireTier: unifiedEmpireTier as AccessTier || AccessTier.NORMIE
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

      // Update unified auth store if wallet address changed
      if (newState.isConnected && newState.address) {
        const currentUnifiedAddress = useUnifiedAuthStore.getState().walletAddress;
        if (currentUnifiedAddress !== newState.address) {
          console.log('[useWallet] Wallet address changed, updating unified auth store:', {
            old: currentUnifiedAddress,
            new: newState.address
          });
          useUnifiedAuthStore.getState().connectWallet(newState.address);
        }
      }

      // Update initializing state if needed
      if (isInitializing && newState.isConnected) {
        setIsInitializing(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-initialization loop

  // Memoized stable values to prevent cascading re-renders
  const stableBBAuth = useMemo(() => ({
    isAuthenticated: bbAuth.isAuthenticated,
    wallet: bbAuth.wallet,
    empireTier: bbAuth.empireTier,
    empireRank: bbAuth.empireRank
  }), [bbAuth.isAuthenticated, bbAuth.wallet, bbAuth.empireTier, bbAuth.empireRank]);

  // Track previous values to prevent unnecessary updates
  const prevBBAuthRef = useRef(stableBBAuth);

  // Update wallet state when BB Auth empire tier changes (with deep equality check)
  useEffect(() => {
    const inMiniapp = isInFarcasterMiniapp();
    const current = stableBBAuth;
    const previous = prevBBAuthRef.current;

    // Only proceed if we're in miniapp and have meaningful changes
    if (!inMiniapp || !current.isAuthenticated || !current.wallet) {
      return;
    }

    // Deep equality check to prevent unnecessary updates
    const hasChanges = (
      previous.isAuthenticated !== current.isAuthenticated ||
      previous.wallet !== current.wallet ||
      previous.empireTier !== current.empireTier ||
      previous.empireRank !== current.empireRank
    );

    if (!hasChanges) {
      return;
    }

    console.log('📱 BB Auth state changed, updating wallet:', {
      changes: {
        authenticated: previous.isAuthenticated !== current.isAuthenticated,
        wallet: previous.wallet !== current.wallet,
        tier: previous.empireTier !== current.empireTier,
        rank: previous.empireRank !== current.empireRank
      },
      current
    });

    const tierMapping: { [key: string]: AccessTier } = {
      'BIZARRE': AccessTier.BIZARRE,
      'WEIRDO': AccessTier.WEIRDO,
      'ODDBALL': AccessTier.ODDBALL,
      'MISFIT': AccessTier.MISFIT,
      'NORMIE': AccessTier.NORMIE
    };

    const mappedTier = tierMapping[current.empireTier || 'NORMIE'] || AccessTier.NORMIE;

    // Update wallet state
    setWalletState(prev => {
      if (prev.address === current.wallet && prev.empireTier === mappedTier && prev.isConnected) {
        return prev; // No change needed
      }

      return {
        isConnected: true,
        address: current.wallet,
        empireTier: mappedTier
      };
    });

    // Update previous reference
    prevBBAuthRef.current = current;
  }, [stableBBAuth]);

  const connect = useCallback(async () => {
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
  }, [isInitializing]);

  const disconnect = useCallback(async () => {
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
  }, []);

  const refreshEmpireData = useCallback(async () => {
    try {
      await web3Service.refreshEmpireData();
    } catch (error) {
      console.error('Failed to refresh Empire data:', error);
    }
  }, []);

  // Memoize computed values to prevent unnecessary re-renders
  const isConnectedViaFarcaster = useMemo(() =>
    farcasterConnected && !!unifiedWalletAddress,
    [farcasterConnected, unifiedWalletAddress]
  );

  const inMiniapp = useMemo(() => isInFarcasterMiniapp(), []);

  const shouldUseBBAuthData = useMemo(() =>
    inMiniapp && stableBBAuth.isAuthenticated && !!stableBBAuth.wallet,
    [inMiniapp, stableBBAuth.isAuthenticated, stableBBAuth.wallet]
  );

  // Memoize the final return object to prevent cascading re-renders
  return useMemo(() => ({
    ...walletState,
    // Override with Farcaster verified address if available
    isConnected: walletState.isConnected || isConnectedViaFarcaster,
    address: isConnectedViaFarcaster ? unifiedWalletAddress : walletState.address,
    // Add empire rank and score from BB Auth when in miniapp
    empireRank: shouldUseBBAuthData ? stableBBAuth.empireRank : walletState.empireRank,
    empireScore: shouldUseBBAuthData ? null : walletState.empireScore,
    isInitializing,
    connect,
    disconnect,
    refreshEmpireData,
    formatAddress: web3Service.formatAddress,
    isViaFarcaster: isConnectedViaFarcaster
  }), [
    walletState,
    isConnectedViaFarcaster,
    unifiedWalletAddress,
    shouldUseBBAuthData,
    stableBBAuth.empireRank,
    isInitializing,
    connect,
    disconnect,
    refreshEmpireData
  ]);
}