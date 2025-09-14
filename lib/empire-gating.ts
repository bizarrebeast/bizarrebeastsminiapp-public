/**
 * Empire Gating Configuration
 * Defines what features are available at each Empire tier
 */

import { AccessTier } from './empire';

// Feature flags that can be gated
export interface FeatureAccess {
  // Watermark
  watermarkOptional: boolean;  // Can remove watermark
  
  // Backgrounds
  uploadCustomBackground: boolean;  // Can upload custom backgrounds
  
  // Sticker Collections Access
  collections: {
    bizarrebeasts: boolean;
    'treasure-quest': boolean;
    vibecards: boolean;
    [key: string]: boolean;  // Allow for future collections
  };
  
  // Individual Sticker Tiers (for future implementation)
  stickerTierAccess: 'all' | 'premium' | 'rare' | 'common' | 'basic';
  
  // Contest Features
  contestParticipation: boolean;
  contestCreation: boolean;
  contestVoting: boolean;
  contestVotingPower: number;  // Multiplier for vote weight
  
  // Export Features
  maxExportSize: number;  // Max resolution for exports
  exportFormats: string[];  // Available formats
  dailyExportLimit: number;  // -1 for unlimited
  
  // Future Features (placeholder)
  aiBackgroundRemoval: boolean;
  animatedStickers: boolean;
  collaborativeMemes: boolean;
  nftMinting: boolean;
}

// Tier-based feature configuration
export const TIER_FEATURES: Record<AccessTier, FeatureAccess> = {
  [AccessTier.BIZARRE]: {
    // Watermark
    watermarkOptional: true,  // Can remove watermark
    
    // Backgrounds
    uploadCustomBackground: true,  // Only for BizarreBeasts collection
    
    // Collections - all unlocked
    collections: {
      bizarrebeasts: true,
      'treasure-quest': true,
      vibecards: true,
    },
    
    // Stickers - access to all tiers
    stickerTierAccess: 'all',
    
    // Contests
    contestParticipation: true,
    contestCreation: true,
    contestVoting: true,
    contestVotingPower: 5,  // 5x voting power
    
    // Export
    maxExportSize: 2000,
    exportFormats: ['png', 'svg'],
    dailyExportLimit: -1,  // Unlimited
    
    // Future features
    aiBackgroundRemoval: true,
    animatedStickers: true,
    collaborativeMemes: true,
    nftMinting: true,
  },
  
  [AccessTier.WEIRDO]: {
    // Watermark
    watermarkOptional: true,  // Can remove watermark
    
    // Backgrounds
    uploadCustomBackground: true,  // Only for BizarreBeasts collection
    
    // Collections - all unlocked
    collections: {
      bizarrebeasts: true,
      'treasure-quest': true,
      vibecards: true,
    },
    
    // Stickers - premium and below
    stickerTierAccess: 'premium',
    
    // Contests
    contestParticipation: true,
    contestCreation: false,
    contestVoting: true,
    contestVotingPower: 3,  // 3x voting power
    
    // Export
    maxExportSize: 1500,
    exportFormats: ['png'],
    dailyExportLimit: -1,  // Unlimited
    
    // Future features
    aiBackgroundRemoval: false,
    animatedStickers: true,
    collaborativeMemes: true,
    nftMinting: false,
  },
  
  [AccessTier.ODDBALL]: {
    // Watermark
    watermarkOptional: false,  // Watermark required
    
    // Backgrounds
    uploadCustomBackground: false,  // No custom uploads
    
    // Collections - all unlocked
    collections: {
      bizarrebeasts: true,
      'treasure-quest': true,
      vibecards: true,  // Unlocked - individual stickers are tier-gated
    },
    
    // Stickers - rare and below
    stickerTierAccess: 'rare',
    
    // Contests
    contestParticipation: true,
    contestCreation: false,
    contestVoting: true,
    contestVotingPower: 2,  // 2x voting power
    
    // Export
    maxExportSize: 1000,
    exportFormats: ['png'],
    dailyExportLimit: 50,
    
    // Future features
    aiBackgroundRemoval: false,
    animatedStickers: false,
    collaborativeMemes: true,
    nftMinting: false,
  },
  
  [AccessTier.MISFIT]: {
    // Watermark
    watermarkOptional: false,  // Watermark required
    
    // Backgrounds
    uploadCustomBackground: false,  // No custom uploads
    
    // Collections - all unlocked
    collections: {
      bizarrebeasts: true,
      'treasure-quest': true,  // Unlocked - individual stickers are tier-gated
      vibecards: true,  // Unlocked - individual stickers are tier-gated
    },
    
    // Stickers - common and below
    stickerTierAccess: 'common',
    
    // Contests
    contestParticipation: true,
    contestCreation: false,
    contestVoting: true,
    contestVotingPower: 1,  // 1x voting power
    
    // Export
    maxExportSize: 800,
    exportFormats: ['png'],
    dailyExportLimit: 20,
    
    // Future features
    aiBackgroundRemoval: false,
    animatedStickers: false,
    collaborativeMemes: false,
    nftMinting: false,
  },
  
  [AccessTier.NORMIE]: {
    // Watermark
    watermarkOptional: false,  // Watermark required
    
    // Backgrounds
    uploadCustomBackground: false,  // No custom uploads
    
    // Collections - all unlocked
    collections: {
      bizarrebeasts: true,  // All collections unlocked
      'treasure-quest': true,  // Individual stickers are tier-gated
      vibecards: true,  // Individual stickers are tier-gated
    },
    
    // Stickers - basic only
    stickerTierAccess: 'basic',
    
    // Contests
    contestParticipation: false,  // Can view but not participate
    contestCreation: false,
    contestVoting: false,
    contestVotingPower: 0,
    
    // Export
    maxExportSize: 800,
    exportFormats: ['png'],
    dailyExportLimit: 5,
    
    // Future features
    aiBackgroundRemoval: false,
    animatedStickers: false,
    collaborativeMemes: false,
    nftMinting: false,
  },
};

// Sticker tier definitions (for when adding artwork)
export type StickerTier = 'all' | 'premium' | 'rare' | 'common' | 'basic';

export interface StickerMetadata {
  id: string;
  name: string;
  src: string;
  thumbnail: string;
  collection: string;
  tier: StickerTier;  // Tier requirement for this sticker
  tags: string[];
}

// Helper functions
export function hasFeatureAccess(userTier: AccessTier, feature: keyof FeatureAccess): boolean {
  const features = TIER_FEATURES[userTier];
  return features ? !!features[feature] : false;
}

export function hasCollectionAccess(userTier: AccessTier, collectionId: string): boolean {
  const features = TIER_FEATURES[userTier];
  return features?.collections[collectionId] || false;
}

export function canRemoveWatermark(userTier: AccessTier): boolean {
  return TIER_FEATURES[userTier]?.watermarkOptional || false;
}

export function canUploadBackground(userTier: AccessTier, collectionId: string): boolean {
  // Only BizarreBeasts collection allows uploads, and only for BIZARRE/Weirdo
  if (collectionId !== 'bizarrebeasts') return false;
  return TIER_FEATURES[userTier]?.uploadCustomBackground || false;
}

export function canAccessSticker(userTier: AccessTier, stickerTier: StickerTier): boolean {
  const userAccess = TIER_FEATURES[userTier]?.stickerTierAccess;
  if (!userAccess) return false;
  
  const tierHierarchy: Record<string, number> = {
    'all': 5,
    'premium': 4,
    'rare': 3,
    'common': 2,
    'basic': 1,
  };
  
  return tierHierarchy[userAccess] >= tierHierarchy[stickerTier];
}

export function getLockedFeatureMessage(feature: string, requiredTier?: AccessTier): string {
  const messages: Record<string, string> = {
    watermark: 'Watermark removal is only available for BIZARRE and Weirdo tiers',
    uploadBackground: 'Custom backgrounds are only available for BIZARRE and Weirdo tiers in the BizarreBeasts collection',
    collection: `This collection requires ${requiredTier || 'weirder'} tier`,
    sticker: `This sticker requires ${requiredTier || 'weirder'} tier`,
    contest: 'Contest participation requires Misfit tier or higher (no Normies allowed!)',
    export: 'You\'ve reached your daily export limit',
  };

  return messages[feature] || `This feature requires ${requiredTier || 'weirder'} tier`;
}