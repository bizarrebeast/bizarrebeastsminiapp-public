'use client';

import { useState, useEffect } from 'react';
import { web3Service, WalletState } from '@/lib/web3';
import { AccessTier } from '@/lib/empire';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    empireTier: AccessTier.VISITOR
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize web3 service
    const init = async () => {
      try {
        await web3Service.initialize();
        await web3Service.checkConnection();
        setWalletState(web3Service.getState());
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    // Subscribe to state changes
    const unsubscribe = web3Service.onStateChange((newState) => {
      setWalletState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = async () => {
    try {
      await web3Service.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
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