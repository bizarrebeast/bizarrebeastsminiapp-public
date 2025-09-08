'use client';

import React, { useState } from 'react';
import { StickerCollection, Sticker } from '@/types';
import { Search, Lock, ChevronDown, ChevronUp, Sparkles, Crown, Star } from 'lucide-react';
import BackgroundSelector from './BackgroundSelector';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canAccessSticker, hasCollectionAccess } from '@/lib/empire-gating';
import UpgradePrompt from '@/components/UpgradePrompt';

interface StickerGalleryProps {
  collections: StickerCollection[];
  selectedCollection: string;
  onSelectCollection: (collectionId: string) => void;
  onSelectSticker: (sticker: Sticker) => void;
  onSelectBackground?: (type: 'color' | 'image' | 'transparent', value?: string) => void;
}

// Helper function to get tier name for collection
function getTierForCollection(collectionId: string): string {
  switch(collectionId) {
    case 'treasure-quest':
    case 'vibecards':
      return 'Veteran';
    default:
      return 'Visitor';
  }
}

// Helper function to get tier badge info
function getTierBadge(tier?: string) {
  switch(tier) {
    case 'all':
      return { 
        icon: <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gem-gold" />, 
        label: 'Elite',
        color: 'text-gem-gold'
      };
    case 'premium':
      return { 
        icon: <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gem-purple" />, 
        label: 'Champion',
        color: 'text-gem-purple'
      };
    case 'rare':
      return { 
        icon: <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gem-blue" />, 
        label: 'Veteran',
        color: 'text-gem-blue'
      };
    case 'common':
      return { 
        icon: <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gem-crystal" />, 
        label: 'Member',
        color: 'text-gem-crystal'
      };
    case 'basic':
    default:
      return null; // Basic tier - no badge needed
  }
}

export default function StickerGallery({
  collections,
  selectedCollection,
  onSelectCollection,
  onSelectSticker,
  onSelectBackground,
}: StickerGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ tier: AccessTier, feature: string }>({
    tier: AccessTier.VETERAN,
    feature: 'Premium Sticker Collection'
  });
  
  const currentCollection = collections.find(c => c.id === selectedCollection);
  
  const { empireTier } = useWallet();
  const userTier = empireTier || AccessTier.VISITOR;
  
  // Sample stickers with actual SVGs and tier requirements
  const mockStickers: Sticker[] = [
    {
      id: '1',
      src: '/stickers/happy-beast.svg',
      thumbnail: '/stickers/happy-beast.svg',
      name: 'Happy Beast',
      tags: ['happy', 'emotion', 'joy'],
      category: 'emotions',
      collection: selectedCollection,
      tier: 'basic', // Available to all
    },
    {
      id: '2',
      src: '/stickers/sad-beast.svg',
      thumbnail: '/stickers/sad-beast.svg',
      name: 'Sad Beast',
      tags: ['sad', 'emotion', 'cry'],
      category: 'emotions',
      collection: selectedCollection,
      tier: 'common', // Member and above
    },
    {
      id: '3',
      src: '/stickers/angry-beast.svg',
      thumbnail: '/stickers/angry-beast.svg',
      name: 'Angry Beast',
      tags: ['angry', 'emotion', 'mad'],
      category: 'emotions',
      collection: selectedCollection,
      tier: 'rare', // Veteran and above
    },
    {
      id: '4',
      src: '/stickers/excited-beast.svg',
      thumbnail: '/stickers/excited-beast.svg',
      name: 'Excited Beast',
      tags: ['excited', 'emotion', 'happy'],
      category: 'emotions',
      collection: selectedCollection,
      tier: 'premium', // Champion and above
    },
    {
      id: '5',
      src: '/stickers/legendary-beast.svg',
      thumbnail: '/stickers/legendary-beast.svg',
      name: 'Legendary Beast',
      tags: ['legendary', 'special', 'rare'],
      category: 'special',
      collection: selectedCollection,
      tier: 'all', // Elite only
    },
  ];

  const filteredStickers = mockStickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sticker.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between text-white font-semibold mb-4 w-full text-left hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Sticker Library
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* Collection Selector */}
          <div className="mb-3">
        <select
          value={selectedCollection}
          onChange={(e) => {
            const collectionId = e.target.value;
            // Check if user has access to this collection
            if (hasCollectionAccess(userTier, collectionId)) {
              onSelectCollection(collectionId);
            } else {
              // Show upgrade prompt for locked collection
              const collection = collections.find(c => c.id === collectionId);
              if (collection) {
                setUpgradeInfo({
                  tier: collection.requiredTier || AccessTier.VETERAN,
                  feature: `${collection.name} Collection`
                });
                setShowUpgradePrompt(true);
              }
            }
          }}
          className="w-full bg-gray-700 text-white rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {collections.map(collection => {
            const hasAccess = hasCollectionAccess(userTier, collection.id);
            const tierRequired = getTierForCollection(collection.id);
            return (
              <option 
                key={collection.id} 
                value={collection.id}
                disabled={!hasAccess}
              >
                {collection.icon} {collection.name}
                {!hasAccess && ` 🔒 (${tierRequired}+)`}
              </option>
            );
          })}
        </select>
      </div>

      {/* Collection Description */}
      {currentCollection && currentCollection.description && (
        <div className="mb-3 p-2 bg-gray-800/50 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            {currentCollection.description}
          </p>
        </div>
      )}

      {/* Background Selector - Show for collections with image or both background types */}
      {currentCollection && onSelectBackground && 
       (currentCollection.backgroundType === 'image' || currentCollection.backgroundType === 'both') && (
        <BackgroundSelector 
          collection={currentCollection}
          onSelectBackground={onSelectBackground}
        />
      )}

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
        <input
          type="text"
          placeholder="Search stickers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white rounded pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Token Gate Message */}
      {currentCollection?.isTokenGated && (
        <div className="mb-3 p-2 sm:p-3 bg-yellow-900/30 border border-yellow-600/50 rounded">
          <div className="flex items-center gap-1 sm:gap-2 text-yellow-400 text-xs sm:text-sm">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Requires {currentCollection.requiredTokenAmount} $BB tokens</span>
          </div>
        </div>
      )}

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {filteredStickers.length > 0 ? (
          filteredStickers.map(sticker => {
            const hasAccess = !sticker.tier || canAccessSticker(userTier, sticker.tier);
            const tierBadge = getTierBadge(sticker.tier);
            
            return (
              <button
                key={sticker.id}
                onClick={() => {
                  if (hasAccess) {
                    onSelectSticker(sticker);
                  } else {
                    // Show upgrade prompt for locked sticker
                    const requiredTier = 
                      sticker.tier === 'all' ? AccessTier.ELITE :
                      sticker.tier === 'premium' ? AccessTier.CHAMPION :
                      sticker.tier === 'rare' ? AccessTier.VETERAN :
                      sticker.tier === 'common' ? AccessTier.MEMBER :
                      AccessTier.VISITOR;
                    
                    setUpgradeInfo({
                      tier: requiredTier,
                      feature: `${sticker.name} Sticker`
                    });
                    setShowUpgradePrompt(true);
                  }
                }}
                className={`group relative bg-gray-700 rounded p-1 sm:p-2 transition-colors aspect-square ${
                  hasAccess ? 'hover:bg-gray-600 cursor-pointer' : 'hover:bg-gray-600/50 cursor-pointer'
                }`}
              >
                {/* Sticker image */}
                <img 
                  src={sticker.thumbnail} 
                  alt={sticker.name}
                  className={`w-full h-full object-contain ${!hasAccess ? 'grayscale' : ''}`}
                />
                
                {/* Tier Badge */}
                {!hasAccess && tierBadge && (
                  <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1 py-0.5 flex items-center gap-0.5">
                    {tierBadge.icon}
                    <span className="text-[8px] sm:text-[10px] font-semibold">
                      {tierBadge.label}
                    </span>
                  </div>
                )}
                
                {/* Hover overlay with name - Desktop only */}
                <div className={`hidden sm:flex absolute inset-0 bg-black/70 opacity-0 ${
                  hasAccess ? 'group-hover:opacity-100' : ''
                } transition-opacity rounded items-end`}>
                  <span className="text-white text-xs p-1 w-full truncate">
                    {sticker.name}
                    {!hasAccess && ' (Locked)'}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-3 text-center text-gray-500 py-4 sm:py-8 text-sm">
            No stickers found
          </div>
        )}
        </div>
      </div>

        </>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        requiredTier={upgradeInfo.tier}
        featureName={upgradeInfo.feature}
        currentTier={userTier}
      />
    </div>
  );
}