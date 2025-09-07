'use client';

import React, { useState } from 'react';
import { StickerCollection, Sticker } from '@/types';
import { Search, Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import BackgroundSelector from './BackgroundSelector';

interface StickerGalleryProps {
  collections: StickerCollection[];
  selectedCollection: string;
  onSelectCollection: (collectionId: string) => void;
  onSelectSticker: (sticker: Sticker) => void;
  onSelectBackground?: (type: 'color' | 'image' | 'transparent', value?: string) => void;
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
  
  const currentCollection = collections.find(c => c.id === selectedCollection);
  
  // Sample stickers with actual SVGs
  const mockStickers: Sticker[] = [
    {
      id: '1',
      src: '/stickers/happy-beast.svg',
      thumbnail: '/stickers/happy-beast.svg',
      name: 'Happy Beast',
      tags: ['happy', 'emotion', 'joy'],
      category: 'emotions',
      collection: selectedCollection,
    },
    {
      id: '2',
      src: '/stickers/sad-beast.svg',
      thumbnail: '/stickers/sad-beast.svg',
      name: 'Sad Beast',
      tags: ['sad', 'emotion', 'cry'],
      category: 'emotions',
      collection: selectedCollection,
    },
    {
      id: '3',
      src: '/stickers/angry-beast.svg',
      thumbnail: '/stickers/angry-beast.svg',
      name: 'Angry Beast',
      tags: ['angry', 'emotion', 'mad'],
      category: 'emotions',
      collection: selectedCollection,
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
          onChange={(e) => onSelectCollection(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {collections.map(collection => (
            <option key={collection.id} value={collection.id}>
              {collection.icon} {collection.name}
              {collection.isTokenGated && ' 🔒'}
            </option>
          ))}
        </select>
      </div>

      {/* Background Selector */}
      {currentCollection && onSelectBackground && (
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
          filteredStickers.map(sticker => (
            <button
              key={sticker.id}
              onClick={() => onSelectSticker(sticker)}
              className="group relative bg-gray-700 rounded p-1 sm:p-2 hover:bg-gray-600 transition-colors aspect-square"
            >
              {/* Sticker image */}
              <img 
                src={sticker.thumbnail} 
                alt={sticker.name}
                className="w-full h-full object-contain"
              />
              
              {/* Hover overlay with name - Desktop only */}
              <div className="hidden sm:flex absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded items-end">
                <span className="text-white text-xs p-1 w-full truncate">
                  {sticker.name}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-3 text-center text-gray-500 py-4 sm:py-8 text-sm">
            No stickers found
          </div>
        )}
        </div>
      </div>

          {/* Upload Section */}
          <div className="mt-3 pt-3 border-t border-gray-700">
        <label className="block">
          <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 block">Upload Custom</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const customSticker: Sticker = {
                    id: `custom-${Date.now()}-${Math.random()}`,
                    src: event.target?.result as string,
                    thumbnail: event.target?.result as string,
                    name: file.name,
                    tags: ['custom'],
                    category: 'custom',
                    collection: 'custom',
                  };
                  onSelectSticker(customSticker);
                };
                reader.readAsDataURL(file);
              });
            }}
            className="block w-full text-xs sm:text-sm text-gray-400
              file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4
              file:rounded file:border-0
              file:text-xs sm:file:text-sm file:font-semibold
              file:bg-purple-600 file:text-white
              hover:file:bg-purple-700
              cursor-pointer"
          />
          </label>
          </div>
        </>
      )}
    </div>
  );
}