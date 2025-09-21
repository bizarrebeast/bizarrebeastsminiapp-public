import { AccessTier } from '@/lib/empire';

export interface Meme {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  template_id?: string;
  share_count: number;
  like_count: number;
  view_count: number;
  is_featured: boolean;
  is_public: boolean;
  is_nft: boolean;
  nft_contract?: string;
  nft_token_id?: string;
  tags: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface MemeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  meme_count: number;
  created_at: string;
  updated_at: string;
}

export interface MemeReaction {
  id: string;
  meme_id: string;
  user_id: string;
  reaction_type: 'like' | 'fire' | 'laugh' | 'mind_blown' | 'love' | 'sad';
  created_at: string;
}

export interface MemeComment {
  id: string;
  meme_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields
  user?: {
    username: string;
    pfp_url?: string;
  };
  replies?: MemeComment[];
}

export interface MemeTemplate {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  category?: string;
  is_premium: boolean;
  required_tier?: AccessTier;
  use_count: number;
  created_by?: string;
  created_at: string;
}

export interface MemeGalleryAccess {
  canUpload: boolean;
  uploadLimit: number;
  storageSize: string;
  canCreateCollections: boolean;
  canUseTemplates: boolean;
  canMintNFT: boolean;
  canMonetize: boolean;
}

export const TIER_ACCESS_CONFIG: Record<AccessTier, MemeGalleryAccess> = {
  [AccessTier.NORMIE]: {
    canUpload: false,
    uploadLimit: 0,
    storageSize: '0MB',
    canCreateCollections: false,
    canUseTemplates: false,
    canMintNFT: false,
    canMonetize: false
  },
  [AccessTier.MISFIT]: {
    canUpload: true,
    uploadLimit: 3,
    storageSize: '10MB',
    canCreateCollections: false,
    canUseTemplates: true,
    canMintNFT: false,
    canMonetize: false
  },
  [AccessTier.ODDBALL]: {
    canUpload: true,
    uploadLimit: 10,
    storageSize: '50MB',
    canCreateCollections: true,
    canUseTemplates: true,
    canMintNFT: false,
    canMonetize: false
  },
  [AccessTier.WEIRDO]: {
    canUpload: true,
    uploadLimit: 25,
    storageSize: '100MB',
    canCreateCollections: true,
    canUseTemplates: true,
    canMintNFT: false,
    canMonetize: false
  },
  [AccessTier.BIZARRE]: {
    canUpload: true,
    uploadLimit: 999, // Effectively unlimited
    storageSize: '500MB',
    canCreateCollections: true,
    canUseTemplates: true,
    canMintNFT: true,
    canMonetize: true
  }
};