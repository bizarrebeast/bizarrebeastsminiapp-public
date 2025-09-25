/**
 * useBBAuth Hook
 * BizarreBeasts authentication with Farcaster SDK
 * Handles race conditions with retry logic
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeBBAuth,
  waitForFarcasterContext,
  requestWalletConnection,
  bbAuthFetch
} from '@/lib/auth/bb-auth-sdk';
import { authenticatedFetch, verifyAuth, endSession } from '@/lib/auth/authenticated-fetch';

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

export function useBBAuth(): BBAuthState & BBAuthActions {
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
    hasTimedOut: false
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMountedRef = useRef(true);

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;
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

      // Initialize BB Auth with retry logic
      console.log('🚀 Initializing BB Auth...');
      const result = await initializeBBAuth();

      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!isMountedRef.current) return;

      if (result.success && result.context) {
        // We have Farcaster context
        const { context, wallet } = result;

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
          hasTimedOut: false
        }));

        console.log('✅ BB Auth initialized:', {
          user: context.user.username,
          wallet: wallet
        });

        // Verify with backend (optional - for session creation)
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
        hasTimedOut: false
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
    await initialize();
  }, []);

  return {
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
  };
}