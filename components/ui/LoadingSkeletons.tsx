'use client';

import React from 'react';

export const CanvasSkeleton = () => (
  <div className="w-full h-[500px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      <p className="mt-4 text-gray-400">Loading meme canvas...</p>
    </div>
  </div>
);

export const StickerGallerySkeleton = () => (
  <div className="space-y-3">
    <div className="h-10 bg-gray-700 rounded animate-pulse" />
    <div className="h-8 bg-gray-700 rounded animate-pulse w-3/4" />
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-16 h-16 bg-gray-700 animate-pulse rounded" />
      ))}
    </div>
  </div>
);

export const TextControlsSkeleton = () => (
  <div className="space-y-3">
    <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3" />
    <div className="h-10 bg-gray-700 rounded animate-pulse" />
    <div className="h-10 bg-gray-700 rounded animate-pulse" />
  </div>
);

export const ExportControlsSkeleton = () => (
  <div className="space-y-3">
    <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3" />
    <div className="h-12 bg-gray-700 rounded animate-pulse" />
    <div className="h-12 bg-gray-700 rounded animate-pulse" />
  </div>
);