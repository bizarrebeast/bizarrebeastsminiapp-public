/**
 * useBBAuth Hook
 * BizarreBeasts authentication with Farcaster SDK
 * Handles race conditions with retry logic
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  initializeBBAuth,
  waitForFarcasterContext,
  requestWalletConnection,
  bbAuthFetch
} from '@/lib/auth/bb-auth-sdk';
import { authenticatedFetch, verifyAuth, endSession } from '@/lib/auth/authenticated-fetch';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

export interface BBAuthState {
  // Authentication state
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;

  // User data
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  } | null;

  // Wallet data
  wallet: string | null;
  isWalletVerified: boolean;

  // Empire data
  empireTier: string | null;
  empireRank: number | null;

  // Context
  isInMiniapp: boolean;
  hasTimedOut: boolean;
}

export interface BBAuthActions {
  // Auth actions
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;

  // Wallet actions
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;

  // Fetch wrapper
  authenticatedFetch: typeof authenticatedFetch;
}

const INIT_TIMEOUT = 10000; // 10 seconds

// Global initialization guard to prevent multiple simultaneous initializations
let globalInitPromise: Promise<any> | null = null;
let globalIsInitialized = false;

export function useBBAuth(): BBAuthState & BBAuthActions {
  // Get UnifiedStore actions and selective state to prevent re-renders
  const connectFarcaster = useUnifiedAuthStore(state => state.connectFarcaster);
  const unifiedConnectWallet = useUnifiedAuthStore(state => state.connectWallet);
  const unifiedFarcasterFid = useUnifiedAuthStore(state => state.farcasterFid);
  const unifiedFarcasterUsername = useUnifiedAuthStore(state => state.farcasterUsername);
  const unifiedWalletAddress = useUnifiedAuthStore(state => state.walletAddress);

  // State
  const [state, setState] = useState<BBAuthState>({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    retryCount: 0,
    user: null,
    wallet: null,
    isWalletVerified: false,
    isInMiniapp: false,
    hasTimedOut: false,
    empireTier: null,
    empireRank: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    // Prevent multiple initializations from same instance
    if (hasInitializedRef.current) {
      console.log('[useBBAuth] Skipping re-initialization, already initialized');
      return;
    }

    isMountedRef.current = true;
    hasInitializedRef.current = true;
    initialize();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Initialize BB Auth with timeout
   */
  const initialize = async () => {
    try {
      if (!isMountedRef.current) return;

      // Check if store is empty (auth regression fix)
      const storeIsEmpty = !unifiedFarcasterFid || !unifiedFarcasterUsername;

      // If global initialization already completed AND store has data, skip
      if (globalIsInitialized && !storeIsEmpty) {
        console.log('[useBBAuth] Global initialization already complete with valid data, skipping');
        return;
      }

      // If store is empty but global says initialized, allow re-init
      if (globalIsInitialized && storeIsEmpty) {
        console.log('[useBBAuth] Global initialized but store is empty, forcing re-initialization');
        globalIsInitialized = false;
      }

      // If another instance is initializing, wait for it
      if (globalInitPromise) {
        console.log('[useBBAuth] Another instance is initializing, waiting...');
        await globalInitPromise;
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null, hasTimedOut: false }));

      // Set timeout for initialization
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && state.isLoading) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            hasTimedOut: true,
            error: 'Authentication timed out. Click retry to try again.'
          }));
        }
      }, INIT_TIMEOUT);

      // Create global init promise to prevent concurrent initializations
      console.log('🚀 Initializing BB Auth...');
      const initPromise = initializeBBAuth();
      globalInitPromise = initPromise;

      const result = await initPromise;
      globalIsInitialized = true;
      globalInitPromise = null;

      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!isMountedRef.current) return;

      if (result.success && result.context) {
        // We have Farcaster context
        const { context } = result;
        let { wallet } = result;

        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          isInMiniapp: true,
          isAuthenticated: true, // In miniapp, having context means authenticated
          user: {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName || context.user.username,
            pfpUrl: context.user.pfpUrl
          },
          wallet: wallet || null,
          hasTimedOut: false,
          empireTier: 'NORMIE', // Default until we fetch real tier
          empireRank: null
        }));

        console.log('✅ BB Auth initialized:', {
          user: context.user.username,
          wallet: wallet
        });

        // Sync with UnifiedStore
        if (context.user) {
          // Fetch verified addresses from Neynar API
          let verifiedAddresses: string[] = [];
          try {
            const neynarResponse = await fetch(`/api/auth/v2/user?fid=${context.user.fid}`);
            if (neynarResponse.ok) {
              const neynarData = await neynarResponse.json();
              verifiedAddresses = neynarData.user?.verified_addresses?.eth_addresses || [];
              console.log('✅ Fetched verified addresses:', verifiedAddresses);

              // If we don't have a wallet but have verified addresses, use the first one
              if (!wallet && verifiedAddresses.length > 0) {
                wallet = verifiedAddresses[0];
                setState(prev => ({ ...prev, wallet: wallet || null }));
                console.log('✅ Using first verified address as wallet:', wallet);
              }
            }
          } catch (error) {
            console.log('Failed to fetch verified addresses:', error);
          }

          // Only sync with UnifiedStore if data is different to prevent infinite loops
          const shouldSync = (
            context.user.fid !== unifiedFarcasterFid ||
            context.user.username !== unifiedFarcasterUsername ||
            wallet !== unifiedWalletAddress
          );

          if (shouldSync) {
            // Sync Farcaster data with UnifiedStore
            try {
              await connectFarcaster({
                fid: context.user.fid,
                username: context.user.username,
                displayName: context.user.displayName || context.user.username,
                pfpUrl: context.user.pfpUrl,
                verifiedAddresses: verifiedAddresses, // Pass as array directly
                verified_addresses: { eth_addresses: verifiedAddresses } // Also pass in expected format
              });
              console.log('✅ Synced Farcaster data with UnifiedStore');
            } catch (error) {
              console.error('❌ Failed to sync with UnifiedStore:', error);
              // Still set local state even if UnifiedStore sync fails
              setState(prev => ({
                ...prev,
                farcasterSynced: false
              }));
            }

            // Also sync wallet if available
            if (wallet) {
              try {
                await unifiedConnectWallet(wallet);
                console.log('✅ Synced wallet with UnifiedStore');
              } catch (error) {
                console.error('❌ Failed to sync wallet with UnifiedStore:', error);
              }
            }
          } else {
            console.log('🚫 Skipping UnifiedStore sync to prevent loops');
          }
        }

        // Fetch empire tier independently, but only if not already loaded for this wallet
        if (wallet && (!state.empireTier || state.empireTier === 'NORMIE')) {
          console.log('📊 Fetching Empire data for new wallet:', wallet);

          // Debounced empire data fetch to prevent rapid successive calls
          setTimeout(async () => {
            if (!isMountedRef.current) return;

            try {
              const empireResponse = await fetch('/api/empire/leaderboard');
              const empireData = await empireResponse.json();

              console.log('📊 Empire leaderboard fetched, searching for wallet:', wallet);

              if (empireData.holders && isMountedRef.current) {
                const holder = empireData.holders.find((h: any) =>
                  h.address?.toLowerCase() === wallet.toLowerCase()
                );

                if (holder) {
                  const rank = holder.rank || null;
                  let tier = 'NORMIE';
                  if (rank && rank <= 25) tier = 'BIZARRE';
                  else if (rank && rank <= 50) tier = 'WEIRDO';
                  else if (rank && rank <= 100) tier = 'ODDBALL';
                  else if (rank && rank <= 500) tier = 'MISFIT';

                  if (isMountedRef.current) {
                    setState(prev => {
                      // Only update if tier actually changed
                      if (prev.empireTier === tier && prev.empireRank === rank) {
                        return prev;
                      }

                      return {
                        ...prev,
                        empireTier: tier,
                        empireRank: rank
                      };
                    });
                    console.log('✅ Empire tier loaded:', tier, 'Rank:', rank);
                  }
                } else {
                  console.log('❌ Wallet not found in leaderboard');
                }
              }
            } catch (error) {
              console.log('Failed to fetch Empire data:', error);
            }
          }, 500); // 500ms delay to debounce
        }

        // Verify with backend separately
        console.log('🔍 Starting backend verification...');
        try {
          const verification = await verifyAuth();
          if (verification.success && isMountedRef.current) {
            setState(prev => ({
              ...prev,
              isWalletVerified: verification.user?.isWalletVerified || false
            }));
          }
        } catch (error) {
          console.log('Backend verification failed, but miniapp auth is valid');
        }
      } else {
        // Not in miniapp or initialization failed
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          isInMiniapp: false,
          error: result.error || null
        }));

        // Check for existing session (web context)
        try {
          const response = await fetch('/api/auth/v2/session');
          const session = await response.json();

          if (session.authenticated && isMountedRef.current) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: {
                fid: session.session.fid,
                username: session.session.username,
                displayName: session.session.username,
                pfpUrl: undefined
              },
              wallet: session.session.wallet,
              isWalletVerified: session.session.isWalletVerified
            }));
          }
        } catch (error) {
          console.log('No existing session');
        }
      }
    } catch (error) {
      console.error('BB Auth initialization error:', error);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: 'Failed to initialize authentication',
          hasTimedOut: false
        }));
      }
    }
  };

  /**
   * Retry initialization (for timeout cases)
   */
  const retry = useCallback(async () => {
    console.log('🔄 Retrying BB Auth initialization...');
    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));

    // Refresh the page as the Slay dev suggested - works 99% of the time
    window.location.reload();
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (state.isInMiniapp) {
        // Already authenticated in miniapp
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      } else {
        // Trigger Neynar auth for web
        window.location.href = '/api/neynar/auth/siwn';
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed'
      }));
      return false;
    }
  }, [state.isInMiniapp]);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await endSession();

      setState({
        isInitialized: true,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        retryCount: 0,
        user: null,
        wallet: null,
        isWalletVerified: false,
        isInMiniapp: state.isInMiniapp,
        hasTimedOut: false,
        empireTier: null,
        empireRank: null
      });

      if (!state.isInMiniapp) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed'
      }));
    }
  }, [state.isInMiniapp]);

  /**
   * Connect wallet with retry logic
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const wallet = await requestWalletConnection();

      if (wallet && isMountedRef.current) {
        // Verify the wallet with backend
        const verification = await verifyAuth();

        setState(prev => ({
          ...prev,
          isLoading: false,
          wallet,
          isWalletVerified: verification.user?.isWalletVerified || false
        }));

        console.log('✅ Wallet connected:', wallet);
        return wallet;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error) {
      console.error('Wallet connection error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to connect wallet'
      }));
      return null;
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    setState(prev => ({
      ...prev,
      wallet: null,
      isWalletVerified: false
    }));
  }, []);

  /**
   * Refresh auth state
   */
  const refresh = useCallback(async () => {
    // Reset global guards to allow re-initialization
    globalIsInitialized = false;
    globalInitPromise = null;
    hasInitializedRef.current = false;
    await initialize();
  }, []);

  // Memoize return value to prevent new object on every render
  return useMemo(() => ({
    // State
    ...state,

    // Actions
    login,
    logout,
    refresh,
    retry,
    connectWallet,
    disconnectWallet,
    authenticatedFetch
  }), [
    state,
    login,
    logout,
    refresh,
    retry,
    connectWallet,
    disconnectWallet
  ]);
}