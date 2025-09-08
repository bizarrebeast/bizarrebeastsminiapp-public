'use client';

import React, { useState, useEffect } from 'react';
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
// No longer needed since collections are open to all
// Individual stickers within collections have their own tier requirements

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
  const [collectionStickers, setCollectionStickers] = useState<Sticker[]>([]);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  
  // Load stickers from metadata when collection changes
  useEffect(() => {
    const loadStickers = async () => {
      setIsLoadingStickers(true);
      try {
        // Try to load metadata for the selected collection
        const response = await fetch(`/assets/stickers/${selectedCollection}/metadata.json`);
        if (response.ok) {
          const metadata = await response.json();
          const stickers: Sticker[] = metadata.stickers.map((sticker: any) => ({
            id: sticker.id,
            src: `/assets/stickers/${selectedCollection}/${sticker.filename}`,
            thumbnail: `/assets/stickers/${selectedCollection}/${sticker.filename}`,
            name: sticker.name,
            tags: sticker.tags,
            category: sticker.category,
            collection: selectedCollection,
            tier: sticker.tier
          }));
          setCollectionStickers(stickers);
        } else {
          // Fallback to mock stickers if no metadata found
          setCollectionStickers(getMockStickers());
        }
      } catch (error) {
        console.log('Using mock stickers for', selectedCollection);
        setCollectionStickers(getMockStickers());
      } finally {
        setIsLoadingStickers(false);
      }
    };
    
    loadStickers();
  }, [selectedCollection]);
  
  // Fallback mock stickers for collections without metadata
  const getMockStickers = (): Sticker[] => [
    {
      id: '1',
      src: '/stickers/happy-beast.svg',
      thumbnail: '/stickers/happy-beast.svg',
      name: 'Happy Beast',
      tags: ['happy', 'emotion', 'joy'],
      category: 'emotions',
      collection: selectedCollection,
      tier: 'basic', // Available to all
    }
  ];
  
  const filteredStickers = collectionStickers.filter(sticker =>

  // Use the filtered stickers already defined above
  // const filteredStickers = collectionStickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sticker.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full overflow-hidden">
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
            // All collections are accessible - no tier checking needed
            onSelectCollection(collectionId);
          }}
          className="w-full bg-gray-700 text-white rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {collections.map(collection => (
            <option 
              key={collection.id} 
              value={collection.id}
            >
              {collection.icon} {collection.name}
            </option>
          ))}
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

      {/* Stickers Horizontal Scroll */}
      <div className="relative">
        {isLoadingStickers ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">
              <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-2" />
              <p className="text-sm">Loading stickers...</p>
            </div>
          </div>
        ) : filteredStickers.length > 0 ? (
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 max-w-full">
            <div className="flex gap-2">
              {filteredStickers.map(sticker => {
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
                    className={`group relative bg-gray-700 rounded p-1 transition-all flex-shrink-0 ${
                      hasAccess ? 'hover:bg-gray-600 hover:scale-110 cursor-pointer' : 'hover:bg-gray-600/50 cursor-pointer'
                    }`}
                    style={{ width: '60px', height: '60px' }}
                    title={sticker.name}
                  >
                    {/* Sticker image */}
                    <img 
                      src={sticker.thumbnail} 
                      alt={sticker.name}
                      className={`w-full h-full object-contain ${!hasAccess ? 'grayscale opacity-60' : ''}`}
                      loading="lazy"
                    />
                    
                    {/* Tier Badge - smaller and only icon on mobile */}
                    {!hasAccess && tierBadge && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded p-0.5">
                        <div className="w-3 h-3">
                          {tierBadge.icon}
                        </div>
                      </div>
                    )}
                    
                    {/* Hover overlay with name - Desktop only */}
                    <div className={`hidden md:flex absolute inset-0 bg-black/80 opacity-0 ${
                      hasAccess ? 'group-hover:opacity-100' : ''
                    } transition-opacity rounded items-center justify-center`}>
                      <span className="text-white text-[9px] px-1 text-center">
                        {sticker.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            No stickers found
          </div>
        )}
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