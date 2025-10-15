import { useEffect, useState } from 'react';
import { useWallet } from './useWallet';

/**
 * Standardized hook for admin wallet management
 * Provides consistent admin wallet access across all admin components
 */
export function useAdminWallet() {
  const { address, isConnected } = useWallet();
  const [adminWallet, setAdminWallet] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setAdminWallet(null);
      return;
    }

    // Store admin wallet in single location
    localStorage.setItem('adminWallet', address.toLowerCase());
    setAdminWallet(address.toLowerCase());
  }, [address, isConnected]);

  const getAdminWallet = (): string | null => {
    // Try in-memory first
    if (adminWallet) return adminWallet;

    // Fallback to localStorage
    const stored = localStorage.getItem('adminWallet');
    if (stored) return stored;

    // Last resort: current connected address
    if (address) return address.toLowerCase();

    return null;
  };

  return {
    adminWallet: getAdminWallet(),
    isConnected,
    address
  };
}