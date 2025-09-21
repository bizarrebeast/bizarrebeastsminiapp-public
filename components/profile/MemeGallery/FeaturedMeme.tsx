'use client';

import React from 'react';
import { Star, ExternalLink, Eye } from 'lucide-react';
import { Meme } from './types';

interface FeaturedMemeProps {
  meme: Meme | null;
  onView?: (meme: Meme) => void;
  isOwner: boolean;
  galleryUnlocked: boolean;
}

export default function FeaturedMeme({
  meme,
  onView,
  isOwner,
  galleryUnlocked
}: FeaturedMemeProps) {
  if (!galleryUnlocked) {
    return (
      <div className="p-[2px] rounded-xl bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-purple">
        <div className="bg-dark-card rounded-xl p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-gem-gold fill-gem-gold" />
              Featured Meme
            </h3>
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-lg flex items-center justify-center">
                <Star className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Unlock the meme gallery to showcase your featured meme
              </p>
              <div className="text-xs text-gray-500">
                $2 USD to unlock • Free featured showcase included
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="p-[2px] rounded-xl bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-purple">
        <div className="bg-dark-card rounded-xl p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-gem-gold fill-gem-gold" />
              Featured Meme
            </h3>
          </div>

          {isOwner ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 text-sm">
                  Star a meme in your gallery to feature it here
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500 text-sm">No featured meme yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-[2px] rounded-xl bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-purple">
      <div className="bg-dark-card rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-gem-gold fill-gem-gold" />
            Featured Meme
          </h3>

          {onView && (
            <button
              onClick={() => onView(meme)}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="View full size"
            >
              <Eye className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div
          className="relative aspect-square rounded-lg overflow-hidden bg-black cursor-pointer group"
          onClick={() => onView && onView(meme)}
        >
          <img
            src={meme.thumbnail_url || meme.image_url}
            alt={meme.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay with title */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
              {meme.title}
            </h4>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <span>❤️</span> {meme.like_count}
              </span>
              <span className="flex items-center gap-1">
                <span>👁️</span> {meme.view_count}
              </span>
              <span className="flex items-center gap-1">
                <span>↗️</span> {meme.share_count}
              </span>
            </div>
          </div>

          {/* Featured badge */}
          <div className="absolute top-3 right-3">
            <div className="px-2 py-1 bg-gem-gold/90 backdrop-blur-sm rounded text-xs font-bold text-dark-bg">
              FEATURED
            </div>
          </div>

          {/* NFT Badge if applicable */}
          {meme.is_nft && (
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 bg-gem-purple/90 backdrop-blur-sm rounded text-xs font-bold text-white">
                NFT
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {meme.is_public && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareUrl = `${window.location.origin}/meme/${meme.id}`;
                navigator.clipboard.writeText(shareUrl);
                alert('Link copied!');
              }}
              className="flex-1 py-1.5 text-xs bg-dark-bg hover:bg-gray-700 rounded transition"
            >
              Copy Link
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my featured meme: ${meme.title}`)}&url=${encodeURIComponent(`${window.location.origin}/meme/${meme.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-1.5 text-xs bg-dark-bg hover:bg-gray-700 rounded transition text-center"
            >
              Share on X
            </a>
          </div>
        )}
      </div>
    </div>
  );
}