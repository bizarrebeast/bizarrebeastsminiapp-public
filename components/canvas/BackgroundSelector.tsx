'use client';

import React, { useState, useEffect } from 'react';
import { BackgroundImage, StickerCollection } from '@/types';
import { Image as ImageIcon, Palette, Upload, Lock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canUploadBackground } from '@/lib/empire-gating';
import UpgradePrompt from '@/components/UpgradePrompt';

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
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const { empireTier } = useWallet();
  const userTier = empireTier || AccessTier.VISITOR;
  
  // Check if user can upload backgrounds (Elite/Champion on BizarreBeasts collection only)
  const canUpload = canUploadBackground(userTier, collection.id);
  
  // Load backgrounds for the collection
  useEffect(() => {
    const loadBackgrounds = async () => {
      if (collection.id === 'bizarrebeasts') {
        // BizarreBeasts doesn't have preset backgrounds, just upload
        setBackgrounds([]);
        return;
      }
      
      setIsLoadingBackgrounds(true);
      
      // For treasure-quest, we have actual backgrounds in the folder
      if (collection.id === 'treasure-quest') {
        // Sample of available backgrounds - you can expand this list
        const bgList = [
          { id: 'bg-1', name: 'Crystal Cavern', file: 'treasure-quest-1.svg' },
          { id: 'bg-2', name: 'Underground Path', file: 'treasure-quest-2.svg' },
          { id: 'bg-3', name: 'Treasure Room', file: 'treasure-quest-3.svg' },
          { id: 'bg-4', name: 'Dark Dungeon', file: 'treasure-quest-4.svg' },
          { id: 'bg-5', name: 'Mystic Portal', file: 'treasure-quest-5.svg' },
          { id: 'bg-6', name: 'Ancient Temple', file: 'treasure-quest-6.svg' },
          { id: 'bg-7', name: 'Lava Cavern', file: 'treasure-quest-7.svg' },
          { id: 'bg-8', name: 'Ice Palace', file: 'treasure-quest-8.svg' },
        ];
        
        const loadedBackgrounds: BackgroundImage[] = bgList.map(bg => ({
          id: bg.id,
          src: `/assets/stickers/treasure-quest/backgrounds/${bg.file}`,
          thumbnail: `/assets/stickers/treasure-quest/backgrounds/${bg.file}`,
          name: bg.name,
          collection: 'treasure-quest',
        }));
        
        setBackgrounds(loadedBackgrounds);
      } else {
        // Mock backgrounds for other collections
        setBackgrounds([]);
      }
      
      setIsLoadingBackgrounds(false);
    };
    
    loadBackgrounds();
  }, [collection.id]);

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
            {!canUpload && (
              <button
                onClick={() => setShowUpgradePrompt(true)}
                className="text-xs text-gem-crystal flex items-center gap-1 hover:text-gem-gold transition-colors"
              >
                <Lock className="w-3 h-3" />
                Elite/Champion only
              </button>
            )}
          </div>

          {/* Upload button */}
          <label 
            onClick={(e) => {
              if (!canUpload) {
                e.preventDefault();
                setShowUpgradePrompt(true);
              }
            }}
            className={`block w-full bg-gray-700 rounded p-3 transition-colors ${
              canUpload ? 'hover:bg-gray-600 cursor-pointer' : 'hover:bg-gray-600/50 cursor-pointer'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              disabled={!canUpload}
              onChange={(e) => {
                if (!canUpload) return;
                
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
              {canUpload ? (
                <>
                  <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-400">Click to upload custom background</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <span className="text-sm text-gray-500">Unlock with Elite or Champion tier</span>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Upgrade Prompt Modal */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          requiredTier={AccessTier.ELITE}
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

      {/* Background Images Grid */}
      {showBackgrounds && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 mb-3">
          {isLoadingBackgrounds ? (
            <div className="col-span-full text-center py-4">
              <span className="text-gray-400 text-sm">Loading backgrounds...</span>
            </div>
          ) : backgrounds.length > 0 ? (
            backgrounds.map(bg => (
              <button
                key={bg.id}
                onClick={() => onSelectBackground('image', bg.src)}
                className="group relative bg-gray-700 rounded p-0.5 hover:bg-gray-600 transition-all hover:scale-105 aspect-square"
                title={bg.name}
              >
                <img
                  src={bg.thumbnail}
                  alt={bg.name}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                />
                
                {/* Selected indicator */}
                {currentBackground === bg.src && (
                  <div className="absolute inset-0 border-2 border-gem-gold rounded pointer-events-none" />
                )}
                
                {/* Hover overlay with name - Desktop only */}
                <div className="hidden sm:flex absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded items-end">
                  <span className="text-white text-[10px] p-1 w-full truncate">
                    {bg.name}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-4">
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
    </div>
  );
}