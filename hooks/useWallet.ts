'use client';

import { useState, useEffect } from 'react';
import { web3Service, WalletState } from '@/lib/web3';
import { AccessTier } from '@/lib/empire';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    empireTier: AccessTier.NORMIE
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize web3 service
    const init = async () => {
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
  }, []);

  const connect = async () => {
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

  return {
    ...walletState,
    isInitializing,
    connect,
    disconnect,
    refreshEmpireData,
    formatAddress: web3Service.formatAddress
  };
}