'use client';

import React, { useState } from 'react';
import { BackgroundImage, StickerCollection } from '@/types';
import { Image as ImageIcon, Palette, Upload, Lock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canUploadBackground } from '@/lib/empire-gating';

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
  const { empireTier } = useWallet();
  const userTier = empireTier || AccessTier.VISITOR;
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundImage[]>([]);
  
  // Check if user can upload backgrounds (Elite/Champion on BizarreBeasts collection only)
  const canUpload = canUploadBackground(userTier, collection.id);
  
  // Mock background images for collections (not for BizarreBeasts - that's upload only)
  const mockBackgrounds: BackgroundImage[] = 
    collection.id === 'treasure-quest' ? [
      {
        id: 'tq-bg-1',
        src: '/backgrounds/treasure-island.svg',
        thumbnail: '/backgrounds/treasure-island-thumb.svg',
        name: 'Treasure Island',
        collection: 'treasure-quest',
      },
      {
        id: 'tq-bg-2',
        src: '/backgrounds/pirate-ship.svg',
        thumbnail: '/backgrounds/pirate-ship-thumb.svg',
        name: 'Pirate Ship',
        collection: 'treasure-quest',
      },
    ] : collection.id === 'vibecards' ? [
      {
        id: 'vc-bg-1',
        src: '/backgrounds/vibe-gradient.svg',
        thumbnail: '/backgrounds/vibe-gradient-thumb.svg',
        name: 'Vibe Gradient',
        collection: 'vibecards',
      },
      {
        id: 'vc-bg-2',
        src: '/backgrounds/cosmic-vibes.svg',
        thumbnail: '/backgrounds/cosmic-vibes-thumb.svg',
        name: 'Cosmic Vibes',
        collection: 'vibecards',
      },
    ] : [];

  // BizarreBeasts doesn't show color picker here (it's in the canvas area)
  const showColorPicker = collection.id !== 'bizarrebeasts' && 
    (collection.backgroundType === 'color' || collection.backgroundType === 'both');
  const showBackgrounds = collection.backgroundType === 'image' || collection.backgroundType === 'both';

  if (!showColorPicker && !showBackgrounds) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold text-sm flex items-center gap-2">
          {showBackgrounds ? <ImageIcon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
          Backgrounds
        </h4>
        {collection.id === 'bizarrebeasts' && !canUpload && (
          <span className="text-xs text-gem-crystal flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Upload: Elite/Champion
          </span>
        )}
      </div>

      {/* Background Images Grid */}
      {showBackgrounds && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Preset backgrounds - not for BizarreBeasts */}
          {mockBackgrounds.map(bg => (
            <button
              key={bg.id}
              onClick={() => onSelectBackground('image', bg.src)}
              className="group relative bg-gray-700 rounded p-1 hover:bg-gray-600 transition-colors aspect-video"
            >
              <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center text-gray-400">
                <span className="text-xs text-center">{bg.name}</span>
              </div>
              
              {/* Selected indicator */}
              {currentBackground === bg.src && (
                <div className="absolute inset-0 border-2 border-purple-500 rounded pointer-events-none" />
              )}
            </button>
          ))}
          
          {/* Custom uploaded backgrounds */}
          {customBackgrounds.map(bg => (
            <button
              key={bg.id}
              onClick={() => onSelectBackground('image', bg.src)}
              className="group relative bg-gray-700 rounded p-1 hover:bg-gray-600 transition-colors aspect-video overflow-hidden"
            >
              <img 
                src={bg.thumbnail || bg.src} 
                alt={bg.name}
                className="w-full h-full object-cover rounded"
              />
              
              {/* Selected indicator */}
              {currentBackground === bg.src && (
                <div className="absolute inset-0 border-2 border-purple-500 rounded pointer-events-none" />
              )}
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomBackgrounds(prev => prev.filter(b => b.id !== bg.id));
                }}
                className="absolute top-1 right-1 bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="text-xs">×</span>
              </button>
            </button>
          ))}
          
          {/* Upload button - Only for Elite/Champion on BizarreBeasts */}
          {collection.id === 'bizarrebeasts' && (
            <label className={`relative bg-gray-700 rounded p-1 transition-colors aspect-video flex items-center justify-center ${
              canUpload ? 'hover:bg-gray-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}>
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
                      const newBackground: BackgroundImage = {
                        id: `custom-${Date.now()}`,
                        src: event.target?.result as string,
                        thumbnail: event.target?.result as string,
                        name: file.name,
                        collection: collection.id,
                      };
                      setCustomBackgrounds(prev => [...prev, newBackground]);
                      // Auto-select the new background
                      onSelectBackground('image', newBackground.src);
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
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Upload Custom</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Elite/Champion</span>
                  </>
                )}
              </div>
            </label>
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