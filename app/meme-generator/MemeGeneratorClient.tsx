'use client';

import { useState, useCallback } from 'react';
import MemeCanvas from '@/components/canvas/MemeCanvas';
import StickerGallery from '@/components/canvas/StickerGallery';
import TextControls from '@/components/canvas/TextControls';
import ExportControls from '@/components/canvas/ExportControls';
import SafariAddToHomePrompt from '@/components/SafariAddToHomePrompt';
import { StickerCollection } from '@/types';
import { AccessTier } from '@/lib/empire';
import { BookOpen, ExternalLink } from 'lucide-react';

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
    requiredTier: AccessTier.NORMIE, // Basic access for all
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
    requiredTier: AccessTier.NORMIE, // Open to all
    sortOrder: 2,
    tags: ['game', 'items'],
  },
  {
    id: 'vibecards',
    name: 'Vibe Cards',
    description: 'This limited-edition pack of cards features hand-illustrated BizarreBeasts artwork, brought to life against a backdrop of retro-futuristic, 1990s-inspired designs. Create nostalgic memes with these vibrant character stickers and backgrounds. All content available to every tier!',
    icon: '🃏',
    stickers: [],
    backgrounds: [], // Will add background images
    backgroundType: 'image', // Background images only (no upload)
    isTokenGated: false,
    requiredTier: AccessTier.NORMIE, // Open to all
    sortOrder: 3,
    tags: ['characters', 'vibes'],
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
    requiredTier: AccessTier.NORMIE, // Open to all
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
        {/* Title and Description */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            Stickers & Meme Creator
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto px-4 mb-4">
            Create your own memes, PFPs, and artwork with BizarreBeasts stickers from the BizarreBeasts universe! Choose from original artwork, game sprites, animations, and unique collections created by BIZARRE community members based on BizarreBeasts characters.
          </p>
          <a
            href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-stickers-and-meme-creator?referrer=0x3FDD6aFEd7a19990632468c7102219d051E685dB"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <BookOpen className="w-5 h-5" />
            How-To Guide
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

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