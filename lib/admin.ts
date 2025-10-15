/**
 * Admin utilities for contest management
 */

// Primary admin wallet from environment
const PRIMARY_ADMIN = process.env.NEXT_PUBLIC_CONTEST_ADMIN_WALLET?.toLowerCase();

// Additional admin wallets (same as Ritual 10 whitelist)
const ADDITIONAL_ADMINS = [
  '0x4F2EcDA8C10EC8Fbe711f6664970826998B81c3E', // Original admin
  '0x300a8611D53ca380dA1c556Ca5F8a64D8e1A9dfB', // Test wallet
  '0x3FDD6aFEd7a19990632468c7102219d051E685dB'  // Additional admin wallet
].map(addr => addr.toLowerCase());

// Combine all admin wallets
export const ADMIN_WALLETS = PRIMARY_ADMIN
  ? [PRIMARY_ADMIN, ...ADDITIONAL_ADMINS]
  : ADDITIONAL_ADMINS;

// Export for backward compatibility
export const ADMIN_WALLET = PRIMARY_ADMIN;

if (!PRIMARY_ADMIN) {
  console.log('⚠️ NEXT_PUBLIC_CONTEST_ADMIN_WALLET not configured, using fallback admin list');
}

/**
 * Check if a wallet address is an admin
 */
export function isAdmin(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase());
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