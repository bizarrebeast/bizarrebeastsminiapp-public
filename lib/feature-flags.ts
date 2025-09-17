/**
 * Feature flags for controlled rollout of new features
 * Allows us to build and test features without affecting production users
 */

export const FEATURES = {
  // Contest system - hidden by default in production
  CONTESTS: process.env.NEXT_PUBLIC_ENABLE_CONTESTS === 'true',

  // Admin panel - only enabled for admin wallet
  CONTEST_ADMIN: process.env.NEXT_PUBLIC_ENABLE_CONTEST_ADMIN === 'true',

  // Voting system for creative contests (future)
  CONTEST_VOTING: process.env.NEXT_PUBLIC_ENABLE_CONTEST_VOTING === 'true',
};

// Admin wallet for contest management
export const CONTEST_ADMIN_WALLET = process.env.NEXT_PUBLIC_CONTEST_ADMIN_WALLET?.toLowerCase() || '';

// Check if current user is admin
export function isContestAdmin(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  return walletAddress.toLowerCase() === CONTEST_ADMIN_WALLET;
}

// Check if contests are enabled for user
export function canAccessContests(): boolean {
  return FEATURES.CONTESTS;
}

// Beta tester wallets (optional future use)
const BETA_TESTERS: string[] = [
  // Add beta tester addresses here
];

export function isBetaTester(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  return BETA_TESTERS.includes(walletAddress.toLowerCase());
}