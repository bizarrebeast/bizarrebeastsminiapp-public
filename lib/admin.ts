/**
 * Admin utilities for contest management
 */

// Admin wallet address - should match .env.local ADMIN_WALLET
export const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase() || '0x4f2ecda8c10ec8fbe711f6664970826998b81c3e';

/**
 * Check if a wallet address is an admin
 */
export function isAdmin(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
}

/**
 * Validate admin access for API routes
 * Returns true if the wallet is an admin, false otherwise
 */
export function validateAdminAccess(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) {
    console.log('Admin access denied: No wallet address provided');
    return false;
  }

  const isAdminUser = isAdmin(walletAddress);

  if (!isAdminUser) {
    console.log(`Admin access denied for wallet: ${walletAddress}`);
  } else {
    console.log(`Admin access granted for wallet: ${walletAddress}`);
  }

  return isAdminUser;
}

/**
 * Get admin dashboard stats
 */
export interface AdminStats {
  totalContests: number;
  activeContests: number;
  pendingSubmissions: number;
  totalSubmissions: number;
  totalWinners: number;
}