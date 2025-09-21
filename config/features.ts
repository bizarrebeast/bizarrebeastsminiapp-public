/**
 * Feature flags for controlling feature visibility
 * These can be overridden by environment variables
 */

export const FEATURE_FLAGS = {
  // Profile features
  ENABLE_PUBLIC_PROFILES: process.env.NEXT_PUBLIC_ENABLE_PUBLIC_PROFILES === 'true' || false,
  ENABLE_PROFILE_MEME_GALLERY: process.env.NEXT_PUBLIC_ENABLE_PROFILE_MEME_GALLERY === 'true' || false,

  // Payment features
  ENABLE_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true' || false,
  ENABLE_DAIMO_PAY: process.env.NEXT_PUBLIC_ENABLE_DAIMO_PAY === 'true' || false,

  // Meme gallery
  ENABLE_MEME_GALLERY: process.env.NEXT_PUBLIC_ENABLE_MEME_GALLERY === 'true' || false,

  // Authentication
  ENABLE_UNIFIED_AUTH: process.env.NEXT_PUBLIC_ENABLE_UNIFIED_AUTH === 'true' || true,

  // Share features
  ENABLE_SHARE_VERIFICATION: process.env.NEXT_PUBLIC_ENABLE_SHARE_VERIFICATION === 'true' || true,

  // Admin features (always check server-side auth too)
  ENABLE_ADMIN_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD === 'true' || true,
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};