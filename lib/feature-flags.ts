/**
 * Feature flags for controlled rollout of new features
 * Allows us to build and test features without affecting production users
 *
 * USAGE:
 * - Set environment variables to 'false' to disable features
 * - Features are enabled by default for production readiness
 * - Use these flags in components: if (FEATURES.CONTESTS) { ... }
 */

export const FEATURES = {
  // Contest system - Production ready, enabled by default
  CONTESTS: process.env.NEXT_PUBLIC_ENABLE_CONTESTS !== 'false',

  // Contest admin panel - Restricted to admin wallets
  CONTEST_ADMIN: process.env.NEXT_PUBLIC_ENABLE_CONTEST_ADMIN !== 'false',

  // Voting system for creative contests - Production ready
  CONTEST_VOTING: process.env.NEXT_PUBLIC_ENABLE_CONTEST_VOTING !== 'false',

  // Unified authentication system - Always enabled (core feature)
  UNIFIED_AUTH: true, // Cannot be disabled - core functionality

  // Profile pages - Individual user profile pages
  PROFILES: process.env.NEXT_PUBLIC_ENABLE_PROFILES !== 'false',

  // Meme gallery - User-generated content galleries (planned)
  MEME_GALLERY: process.env.NEXT_PUBLIC_ENABLE_MEME_GALLERY === 'true', // Opt-in for now

  // Analytics tracking - User behavior and feature usage
  ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false',
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