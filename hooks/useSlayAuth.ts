/**
 * useSlayAuth Hook
 * Implements the Slay to Earn authentication approach
 * Provides seamless auth in Farcaster contexts
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import {
  initializeAuth,
  verifyAuth,
  getConnectedWallet,
  requestWalletConnection,
  authenticatedFetch,
  endSession,
  checkSession
} from '@/lib/auth/authenticated-fetch';

export interface SlayAuthState {
  // Authentication state
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

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
}

export interface SlayAuthActions {
  // Auth actions
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  // Wallet actions
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;

  // Fetch wrapper
  authenticatedFetch: typeof authenticatedFetch;
}

export function useSlayAuth(): SlayAuthState & SlayAuthActions {
  // State
  const [state, setState] = useState<SlayAuthState>({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    wallet: null,
    isWalletVerified: false,
    isInMiniapp: false
  });

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  /**
   * Initialize authentication
   */
  const initialize = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if in miniapp
      const isInMiniapp = await sdk.isInMiniApp();
      console.log('🚀 Initializing auth, in miniapp:', isInMiniapp);

      if (isInMiniapp) {
        // Wait for SDK to be ready
        await sdk.actions.ready();
        console.log('✅ Farcaster SDK ready');

        // Get context
        const context = await sdk.context;
        console.log('📱 Farcaster context:', context);
      }

      // Initialize auth
      const authResult = await initializeAuth();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        isInMiniapp,
        isAuthenticated: authResult.isAuthenticated,
        user: authResult.user ? {
          fid: authResult.user.fid,
          username: authResult.user.username,
          displayName: authResult.user.displayName || authResult.user.username,
          pfpUrl: authResult.user.pfpUrl
        } : null,
        wallet: authResult.wallet || null,
        isWalletVerified: authResult.user?.isWalletVerified || false
      }));

      console.log('✅ Auth initialized:', {
        authenticated: authResult.isAuthenticated,
        user: authResult.user?.username,
        wallet: authResult.wallet
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: 'Failed to initialize authentication'
      }));
    }
  };

  /**
   * Login - different behavior based on context
   */
  const login = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (state.isInMiniapp) {
        // In miniapp, auth should be automatic
        console.log('📱 Verifying Farcaster auth...');
        const verification = await verifyAuth();

        if (verification.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: true,
            user: {
              fid: verification.user.fid,
              username: verification.user.username,
              displayName: verification.user.displayName || verification.user.username,
              pfpUrl: verification.user.pfpUrl
            },
            isWalletVerified: verification.user.isWalletVerified
          }));

          // Try to get wallet
          const wallet = await getConnectedWallet();
          if (wallet) {
            setState(prev => ({ ...prev, wallet }));
          }

          return true;
        }
      } else {
        // In web, trigger Neynar auth flow
        console.log('🌐 Triggering Neynar auth...');
        // This would redirect to Neynar auth
        window.location.href = '/api/neynar/auth/siwn';
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed'
      }));
      return false;
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
        user: null,
        wallet: null,
        isWalletVerified: false,
        isInMiniapp: state.isInMiniapp
      });

      // Reload page to clear all state
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
   * Connect wallet
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const wallet = await requestWalletConnection();

      if (wallet) {
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
    connectWallet,
    disconnectWallet,
    authenticatedFetch
  };
}

