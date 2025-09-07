'use client';

import React from 'react';
import { BackgroundImage, StickerCollection } from '@/types';
import { Image as ImageIcon, Palette } from 'lucide-react';

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
  
  // Mock background images for collections
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

  const showColorPicker = collection.backgroundType === 'color' || collection.backgroundType === 'both';
  const showBackgrounds = collection.backgroundType === 'image' || collection.backgroundType === 'both';

  if (!showColorPicker && !showBackgrounds) {
    return null;
  }

  return (
    <div className="mb-4">
      <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
        {showBackgrounds ? <ImageIcon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
        Backgrounds
      </h4>

      {/* Background Images Grid */}
      {showBackgrounds && (
        <div className="grid grid-cols-2 gap-2 mb-3">
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