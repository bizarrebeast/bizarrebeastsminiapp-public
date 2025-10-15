'use client';

import React, { useState, useEffect } from 'react';
import { BackgroundImage, StickerCollection } from '@/types';
import { Image as ImageIcon, Palette, Upload, Lock, RefreshCw, Crown, Star } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canUploadBackground, canAccessSticker } from '@/lib/empire-gating';
import UpgradePrompt from '@/components/UpgradePrompt';

// Extended background type with tier
interface TieredBackground extends BackgroundImage {
  tier?: 'basic' | 'common' | 'rare' | 'premium' | 'all';
}

interface BackgroundSelectorProps {
  collection: StickerCollection;
  onSelectBackground: (type: 'color' | 'image' | 'transparent', value?: string) => void;
  currentBackground?: string;
}

export default function BackgroundSelector({ 
  collection, 
  onSelectBackground,
  currentBackground 
}: BackgroundSelectorProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ tier: AccessTier, feature: string }>({
    tier: AccessTier.ODDBALL,
    feature: 'Premium Background'
  });
  const [backgrounds, setBackgrounds] = useState<TieredBackground[]>([]);
  const [allBackgrounds, setAllBackgrounds] = useState<TieredBackground[]>([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  
  const { empireTier } = useWallet();
  const userTier = empireTier || AccessTier.NORMIE;
  
  // Check if user can upload backgrounds (BIZARRE/Weirdo on BizarreBeasts collection only)
  const canUpload = canUploadBackground(userTier, collection.id);
  
  // Load all backgrounds metadata once
  useEffect(() => {
    const loadBackgroundsMetadata = async () => {
      if (collection.id === 'bizarrebeasts') {
        // BizarreBeasts doesn't have preset backgrounds, just upload
        setAllBackgrounds([]);
        return;
      }
      
      if (collection.id === 'treasure-quest') {
        try {
          const response = await fetch('/assets/stickers/treasure-quest/backgrounds-metadata.json');
          if (response.ok) {
            const data = await response.json();
            const loadedBackgrounds: TieredBackground[] = data.backgrounds.map((bg: any) => ({
              id: bg.id,
              src: `/assets/stickers/treasure-quest/backgrounds/${bg.file}`,
              thumbnail: `/assets/stickers/treasure-quest/backgrounds/${bg.file}`,
              name: bg.name,
              collection: 'treasure-quest',
              tier: bg.tier
            }));
            setAllBackgrounds(loadedBackgrounds);
            // Load initial set
            loadRandomBackgrounds(loadedBackgrounds, new Set());
          }
        } catch (error) {
          console.error('Failed to load backgrounds metadata:', error);
          setAllBackgrounds([]);
        }
      } else if (collection.id === 'vibecards') {
        try {
          const response = await fetch('/assets/stickers/vibecards/metadata.json');
          if (response.ok) {
            const data = await response.json();
            const loadedBackgrounds: TieredBackground[] = data.backgrounds.map((bg: any) => ({
              id: bg.id,
              src: `/assets/stickers/vibecards/${bg.filename}`,
              thumbnail: `/assets/stickers/vibecards/${bg.filename}`,
              name: bg.name,
              collection: 'vibecards',
              tier: bg.tier || 'basic'
            }));
            setAllBackgrounds(loadedBackgrounds);
            // Load initial set
            loadRandomBackgrounds(loadedBackgrounds, new Set());
          }
        } catch (error) {
          console.error('Failed to load vibecards backgrounds:', error);
          setAllBackgrounds([]);
        }
      } else {
        setAllBackgrounds([]);
      }
    };
    
    loadBackgroundsMetadata();
  }, [collection.id]);
  
  // Function to load 5 random backgrounds
  const loadRandomBackgrounds = (bgPool: TieredBackground[], currentUsed: Set<number>) => {
    if (bgPool.length === 0) return;
    
    setIsLoadingBackgrounds(true);
    
    // Get available indices (not yet used)
    const availableIndices = bgPool
      .map((_, index) => index)
      .filter(index => !currentUsed.has(index));
    
    // If we've used all backgrounds, reset
    if (availableIndices.length < 5) {
      currentUsed.clear();
      availableIndices.push(...bgPool.map((_, index) => index));
    }
    
    // Randomly select 5 backgrounds
    const selected: TieredBackground[] = [];
    const newUsed = new Set(currentUsed);
    
    for (let i = 0; i < Math.min(5, availableIndices.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const bgIndex = availableIndices[randomIndex];
      selected.push(bgPool[bgIndex]);
      newUsed.add(bgIndex);
      availableIndices.splice(randomIndex, 1);
    }
    
    setBackgrounds(selected);
    setUsedIndices(newUsed);
    setIsLoadingBackgrounds(false);
  };
  
  // Load new backgrounds function
  const loadNewBackgrounds = () => {
    loadRandomBackgrounds(allBackgrounds, usedIndices);
  };

  // Helper function to get tier badge
  const getTierBadge = (tier?: string) => {
    switch(tier) {
      case 'all':
      case 'elite':
        return { 
          icon: <Crown className="w-3 h-3 text-gem-gold" />, 
          label: 'BIZARRE',
          color: 'text-gem-gold'
        };
      case 'premium':
        return { 
          icon: <Star className="w-3 h-3 text-gem-purple" />, 
          label: 'Weirdo',
          color: 'text-gem-purple'
        };
      case 'rare':
        return { 
          icon: <Star className="w-3 h-3 text-gem-blue" />, 
          label: 'Oddball',
          color: 'text-gem-blue'
        };
      case 'common':
        return { 
          icon: <Star className="w-3 h-3 text-gem-crystal" />, 
          label: 'Misfit',
          color: 'text-gem-crystal'
        };
      case 'basic':
      default:
        return null;
    }
  };

  // BizarreBeasts doesn't show color picker here (it's in the canvas area)
  const showColorPicker = collection.id !== 'bizarrebeasts' && 
    (collection.backgroundType === 'color' || collection.backgroundType === 'both');
  const showBackgrounds = collection.backgroundType === 'image' || collection.backgroundType === 'both';

  if (!showColorPicker && !showBackgrounds) {
    return null;
  }

  // Special case for BizarreBeasts - just show upload button
  if (collection.id === 'bizarrebeasts') {
    return (
      <>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Upload Background
            </h4>
          </div>

          {/* Upload button */}
          <label
            className="block w-full bg-gray-700 rounded p-3 transition-colors hover:bg-gray-600 cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    // Directly apply the background without storing it
                    onSelectBackground('image', event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
                // Reset input
                e.target.value = '';
              }}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <span className="text-sm text-gray-400">Click to upload custom background</span>
            </div>
          </label>
        </div>

        {/* Upgrade Prompt Modal */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          requiredTier={AccessTier.BIZARRE}
          featureName="Upload Custom Backgrounds"
          currentTier={userTier}
        />
      </>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold text-sm flex items-center gap-2">
          {showBackgrounds ? <ImageIcon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
          Backgrounds
        </h4>
      </div>

      {/* Background Images Horizontal Scroll */}
      {showBackgrounds && (
        <div className="mb-3">
          {isLoadingBackgrounds ? (
            <div className="text-center py-4">
              <span className="text-gray-400 text-sm">Loading backgrounds...</span>
            </div>
          ) : backgrounds.length > 0 ? (
            <>
              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 max-w-full">
                <div className="flex gap-2">
                  {backgrounds.map(bg => {
                    const hasAccess = true; // All backgrounds free for everyone - no tier gating

                    return (
                      <button
                        key={bg.id}
                        onClick={() => {
                          if (hasAccess) {
                            onSelectBackground('image', bg.src);
                          } else {
                            // Show upgrade prompt for locked background
                            const requiredTier = 
                              bg.tier === 'all' ? AccessTier.BIZARRE :
                              bg.tier === 'premium' ? AccessTier.WEIRDO :
                              bg.tier === 'rare' ? AccessTier.ODDBALL :
                              bg.tier === 'common' ? AccessTier.MISFIT :
                              AccessTier.NORMIE;
                            
                            setUpgradeInfo({
                              tier: requiredTier,
                              feature: `${bg.name} Background`
                            });
                            setShowUpgradePrompt(true);
                          }
                        }}
                        className={`group relative bg-gradient-to-br from-gray-700 to-gray-800 rounded p-0.5 transition-all flex-shrink-0 overflow-hidden ${
                          hasAccess ? 'hover:bg-gray-600 hover:scale-105 cursor-pointer' : 'hover:bg-gray-600/50 cursor-pointer'
                        }`}
                        style={{ width: '80px', height: '80px' }}
                        title={bg.name}
                      >
                        {/* Placeholder text while loading */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-[10px] font-mono">
                          BG{bg.id.replace('bg-', '')}
                        </div>
                        
                        <img
                          src={bg.thumbnail}
                          alt={bg.name}
                          className="relative w-full h-full object-cover rounded z-10"
                          loading="lazy"
                          onError={(e) => {
                            console.error('Failed to load background:', bg.thumbnail);
                            // Hide the broken image
                            (e.target as HTMLImageElement).style.opacity = '0';
                          }}
                        />

                        {/* Selected indicator */}
                        {currentBackground === bg.src && (
                          <div className="absolute inset-0 border-2 border-gem-gold rounded pointer-events-none z-30" />
                        )}
                        
                        {/* Hover overlay with name - Desktop only */}
                        <div className={`hidden sm:flex absolute inset-0 bg-black/70 opacity-0 ${
                          hasAccess ? 'group-hover:opacity-100' : ''
                        } transition-opacity rounded items-center justify-center z-20`}>
                          <span className="text-white text-[9px] px-1 text-center">
                            {bg.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Load New Backgrounds Button */}
              <button
                onClick={loadNewBackgrounds}
                className="mt-2 w-full bg-gray-700 hover:bg-gray-600 text-white rounded px-3 py-1.5 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Load New Backgrounds
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-gray-500 text-sm">No backgrounds available</span>
            </div>
          )}
        </div>
      )}

      {/* Color Options - Only for collections that support colors */}
      {showColorPicker && (
        <div className="space-y-2">
          <div className="text-gray-400 text-xs mb-1">Color Options</div>
          <div className="grid grid-cols-6 gap-1">
            {/* Preset colors */}
            {['#1F2937', '#DC2626', '#059669', '#2563EB', '#9333EA', '#F59E0B'].map(color => (
              <button
                key={color}
                onClick={() => onSelectBackground('color', color)}
                className="w-full aspect-square rounded border-2 border-gray-600 hover:border-gray-400"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {/* Transparent option */}
          <button
            onClick={() => onSelectBackground('transparent')}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs"
          >
            Transparent
          </button>
        </div>
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