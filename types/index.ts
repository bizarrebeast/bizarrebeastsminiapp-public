// User and Authentication Types
export interface User {
  id: string;
  farcasterFid: number;
  username?: string;
  walletAddress?: string;
  profileImage?: string;
  preferredCollection?: string;
  settings?: UserSettings;
  createdAt: Date;
  lastActive: Date;
}

export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  defaultBackground?: string;
  watermarkEnabled: boolean;
}

// Meme Generator Types
export interface MemeCanvas {
  width: number;
  height: number;
  exportSize: number;
  elements: CanvasElement[];
  background: CanvasBackground;
}

export interface CanvasElement {
  id: string;
  type: 'sticker' | 'text' | 'shape';
  src?: string;
  text?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  locked?: boolean;
  opacity?: number;
}

export interface CanvasBackground {
  type: 'solid' | 'image' | 'transparent';
  value?: string; // Color hex or image URL
}

// Sticker System Types
export interface StickerCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  stickers: Sticker[];
  backgrounds?: BackgroundImage[];
  backgroundType: 'color' | 'image' | 'both' | 'none';
  isTokenGated: boolean;
  requiredTokenAmount?: number;
  sortOrder: number;
  tags: string[];
}

export interface BackgroundImage {
  id: string;
  src: string;
  thumbnail: string;
  name: string;
  collection: string;
}

export interface Sticker {
  id: string;
  src: string;
  thumbnail: string;
  name: string;
  tags: string[];
  category: string;
  collection: string;
  size?: { width: number; height: number };
}

// Text Overlay Types
export interface TextOptions {
  font: 'Impact' | 'Arial' | 'Comic Sans';
  size: number;
  color: string;
  stroke: string;
  strokeWidth: number;
  position: 'top' | 'bottom' | 'custom';
  align: 'left' | 'center' | 'right';
}

// Contest Types
export interface Contest {
  id: string;
  name: string;
  description: string;
  rules: string[];
  startDate: Date;
  endDate: Date;
  prizes: Prize[];
  submissionCount: number;
  featured: boolean;
  votingEnabled: boolean;
  featuredCollection?: string;
  active: boolean;
}

export interface Prize {
  place: number;
  reward: string;
  description: string;
}

export interface ContestEntry {
  id: string;
  contestId: string;
  userId: string;
  memeData: string; // Base64 or IPFS hash
  votes: number;
  submittedAt: Date;
}

// Game Types
export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  platforms: GamePlatform[];
  featured: boolean;
  playCount: number;
}

export interface GamePlatform {
  type: 'telegram' | 'world' | 'web' | 'farcaster';
  url: string;
  available: boolean;
}

// Analytics Types
export enum AnalyticsEvent {
  // User events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  WALLET_CONNECTED = 'wallet_connected',
  
  // Meme generator events
  MEME_STARTED = 'meme_started',
  STICKER_ADDED = 'sticker_added',
  TEXT_ADDED = 'text_added',
  MEME_EXPORTED = 'meme_exported',
  MEME_SHARED = 'meme_shared',
  
  // Collection events
  COLLECTION_SELECTED = 'collection_selected',
  COLLECTION_UNLOCKED = 'collection_unlocked',
  
  // Contest events
  CONTEST_ENTERED = 'contest_entered',
  CONTEST_VOTED = 'contest_voted',
  
  // Game events
  GAME_CLICKED = 'game_clicked',
  GAME_LAUNCHED = 'game_launched',
  
  // Performance events
  PAGE_LOAD = 'page_load',
  ERROR_OCCURRED = 'error_occurred',
}

// Export Options
export interface ExportOptions {
  format: 'png'; // PNG only for crisp text
  quality: number; // Not used for PNG, kept for compatibility
  watermark: {
    enabled: boolean;
    text?: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    opacity: number;
  };
  shareToFarcaster: boolean;
  downloadToDevice: boolean;
}