'use client';

import { useState, useCallback } from 'react';
import MemeCanvas from '@/components/canvas/MemeCanvas';
import StickerGallery from '@/components/canvas/StickerGallery';
import TextControls from '@/components/canvas/TextControls';
import ExportControls from '@/components/canvas/ExportControls';
import SafariAddToHomePrompt from '@/components/SafariAddToHomePrompt';
import { StickerCollection } from '@/types';
import { AccessTier } from '@/lib/empire';

// Collections with Empire tier requirements
const mockCollections: StickerCollection[] = [
  {
    id: 'bizarrebeasts',
    name: 'BizarreBeasts',
    description: 'The original hand-illustrated BizarreBeasts collection featuring all the notorious BizarreBeasts. Create BIZARRE and hilarious memes and artwork with BizarreBeasts stickers and share them with the community! Higher tier stickers are marked with badges and unlock as you climb the Empire leaderboard.',
    icon: '👹',
    stickers: [],
    backgrounds: [],
    backgroundType: 'image', // Upload only for Elite/Champion (color picker is in canvas)
    isTokenGated: false,
    requiredTier: AccessTier.VISITOR, // Basic access for all
    sortOrder: 1,
    tags: ['characters', 'main'],
  },
  {
    id: 'treasure-quest',
    name: 'Treasure Quest',
    description: 'Hand-illustrated sprites and treasures from BizarreBeasts: Treasure Quest! Create epic memes with heroes, enemies, legendary loot, and dungeon backgrounds straight from the game. Premium content and rare artifacts unlock as you advance through Empire tiers.',
    icon: '💎',
    stickers: [],
    backgrounds: [], // Will add background images
    backgroundType: 'image', // Background images only (no upload)
    isTokenGated: false,
    requiredTier: AccessTier.VISITOR, // Open to all
    sortOrder: 2,
    tags: ['game', 'items'],
  },
  {
    id: 'vibecards',
    name: 'Vibecards (Coming Soon)',
    description: 'Special vibe check characters and mood expressions. Perfect for creating reaction memes! This collection is coming soon.',
    icon: '🃏',
    stickers: [],
    backgrounds: [], // Will add background images
    backgroundType: 'image', // Background images only (no upload)
    isTokenGated: false,
    requiredTier: AccessTier.VISITOR, // Open to all
    sortOrder: 3,
    tags: ['characters', 'vibes'],
    disabled: true, // Mark as disabled
  },
  {
    id: 'ugc-memes',
    name: 'UGC Memes by @siablo.eth',
    description: 'Siablo $BB Memes Collection - Hand-illustrated BizarreBeasts stickers and memes created by @siablo.eth for the $BB Community! Create BIZARRE content with custom artwork and characters based on the original BizarreBeasts. All stickers in this collection are available to everyone!',
    icon: '🐐',
    stickers: [],
    backgrounds: [],
    backgroundType: 'color', // Color picker only (no background images)
    isTokenGated: false,
    requiredTier: AccessTier.VISITOR, // Open to all
    sortOrder: 4,
    tags: ['community', 'ugc', 'memes'],
  },
];

export default function MemeGeneratorPage() {
  const [selectedCollection, setSelectedCollection] = useState<string>('bizarrebeasts');
  const [canvasRef, setCanvasRef] = useState<any>(null);
  
  // Use useCallback to prevent recreating the function on every render
  const handleCanvasReady = useCallback((ref: any) => {
    setCanvasRef(ref);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg flex flex-col">
      <SafariAddToHomePrompt />
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Header */}
        <div className="mb-4 flex justify-center">
          <img 
            src="/assets/page-assets/banners/stickers-meme-creator-banner.png" 
            alt="Meme Generator - Create epic memes with BizarreBeasts stickers"
            className="w-full max-w-4xl object-contain rounded-2xl"
          />
        </div>
        
        {/* Description */}
        <p className="text-lg text-gray-300 mb-8 max-w-4xl mx-auto px-4 text-center">
          Create your own memes, PFPs, and artwork with BizarreBeasts stickers from the BizarreBeasts universe! Choose from original artwork, game sprites, animations, and unique collections created by BIZARRE community members based on BizarreBeasts characters.
        </p>

        {/* Sticker Library - Above everything */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-3 sm:p-4 mb-4">
          <StickerGallery
            collections={mockCollections}
            selectedCollection={selectedCollection}
            onSelectCollection={setSelectedCollection}
            onSelectSticker={(sticker) => {
              if (canvasRef) {
                canvasRef.addSticker(sticker);
              }
            }}
            onSelectBackground={(type, value) => {
              if (canvasRef) {
                canvasRef.setBackground(type, value);
              }
            }}
          />
        </div>

        {/* Main Layout - Canvas and Controls */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 sm:gap-4 lg:gap-6">
          {/* Left - Canvas */}
          <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-3 sm:p-4 flex items-start justify-center min-h-[400px]">
            <MemeCanvas
              onCanvasReady={handleCanvasReady}
              selectedCollection={mockCollections.find(c => c.id === selectedCollection)}
            />
          </div>

          {/* Right - Controls */}
          <div className="space-y-2 sm:space-y-4">
            {/* Text Controls */}
            <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-3 sm:p-4 transition-all duration-300">
              <TextControls
                onAddText={(text, options) => {
                  if (canvasRef) {
                    canvasRef.addText(text, options);
                  }
                }}
                onUpdateText={(updates) => {
                  if (canvasRef && canvasRef.updateSelectedText) {
                    canvasRef.updateSelectedText(updates);
                  }
                }}
              />
            </div>

            {/* Export Controls */}
            <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-3 sm:p-4 transition-all duration-300">
              <ExportControls
                onExport={(options) => {
                  if (canvasRef) {
                    canvasRef.export(options);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}