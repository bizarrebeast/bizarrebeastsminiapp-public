'use client';

import React, { useState } from 'react';
import { SharePlatform, shareToSocial, shareMemeWithImage, SHARE_TEMPLATES, formatTextForPlatform } from '@/lib/social-sharing';
import { shareMemeToFarcaster } from '@/lib/farcaster';
import { ultimateShare } from '@/lib/sdk-ultimate';
import { sdk } from '@/lib/sdk-init';

interface ShareButtonsProps {
  imageDataUrl?: string;
  customText?: string;
  shareType?: 'default' | 'meme' | 'rank' | 'ritual';
  rank?: number;
  ritualData?: {
    id: number;
    title: string;
    description: string;
    actionUrl?: string;
  };
  className?: string;
  showLabels?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
}

export default function ShareButtons({
  imageDataUrl,
  customText,
  shareType = 'default',
  rank,
  ritualData,
  className = '',
  showLabels = true,
  buttonSize = 'md'
}: ShareButtonsProps) {
  const [sharing, setSharing] = useState<SharePlatform | null>(null);

  const handleShare = async (platform: SharePlatform) => {
    setSharing(platform);

    try {
      // For Farcaster, check if we're in the miniapp to use the right method
      if (platform === 'farcaster') {
        // Check if we're in Farcaster miniapp
        const isInMiniApp = await sdk.isInMiniApp();

        // Prepare the share text
        let shareText = customText;
        if (!shareText && shareType) {
          shareText = SHARE_TEMPLATES.farcaster[shareType];
          // Replace placeholders
          if (rank && shareText.includes('#{rank}')) {
            shareText = shareText.replace('#{rank}', rank.toString());
          }
          if (ritualData && shareType === 'ritual') {
            shareText = shareText.replace('{id}', ritualData.id.toString());
            shareText = shareText.replace('{title}', ritualData.title);
            shareText = shareText.replace('{description}', ritualData.description);
          }
        }

        if (isInMiniApp) {
          // Use ultimateShare for native Farcaster sharing (works on mobile!)
          await ultimateShare({
            text: shareText || SHARE_TEMPLATES.farcaster.default,
            embeds: ['https://bbapp.bizarrebeasts.io'],
            channelKey: 'bizarrebeasts'
          });
        } else {
          // Fallback to opening Warpcast compose for browser users
          await shareMemeToFarcaster(
            imageDataUrl || '',
            shareText,
            'bizarrebeasts'
          );
        }
      } else {
        // For other platforms, use the new social sharing
        let text = customText;
        if (!text && shareType) {
          text = SHARE_TEMPLATES[platform][shareType];
          // Replace rank placeholder if needed
          if (rank && text.includes('#{rank}')) {
            text = text.replace('#{rank}', rank.toString());
          }
          // Replace ritual placeholders if needed
          if (ritualData && shareType === 'ritual') {
            text = text.replace('{id}', ritualData.id.toString());
            text = text.replace('{title}', ritualData.title);
            text = text.replace('{description}', ritualData.description);
          }
        }

        // Format text for specific platform (handles, $BB spacing)
        if (text) {
          text = formatTextForPlatform(text, platform);
        }

        // For Twitter and Telegram
        await shareToSocial({
          platform,
          text,
          url: 'https://bbapp.bizarrebeasts.io',
          hashtags: platform === 'twitter' ? ['BizarreBeasts', 'BB'] : undefined,
        });
      }
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error);
      alert(`Failed to share to ${platform}. Please try again.`);
    } finally {
      setSharing(null);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Farcaster Button (First) */}
      <button
        onClick={() => handleShare('farcaster')}
        disabled={sharing === 'farcaster'}
        className={`
          ${sizeClasses[buttonSize]}
          bg-gradient-to-br from-purple-600 to-purple-700
          hover:from-purple-500 hover:to-purple-600
          disabled:from-purple-800 disabled:to-purple-900
          text-white rounded-lg flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          disabled:scale-100 disabled:opacity-50
          shadow-lg hover:shadow-purple-500/25
        `}
        title="Share to Farcaster"
      >
        {sharing === 'farcaster' ? (
          <div className={`${iconSizes[buttonSize]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <svg className={iconSizes[buttonSize]} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.24 2H5.76A3.76 3.76 0 002 5.76v12.48A3.76 3.76 0 005.76 22h12.48A3.76 3.76 0 0022 18.24V5.76A3.76 3.76 0 0018.24 2zm-1.32 15.44h-2.16v-6.72c0-1.68-1.08-2.64-2.52-2.64-1.32 0-2.28.84-2.28 2.16v7.2H7.8V6.56h2.16v1.2c.48-.84 1.44-1.44 2.64-1.44 2.28 0 4.32 1.56 4.32 4.44v6.68z"/>
          </svg>
        )}
      </button>

      {/* X/Twitter Button (Second) */}
      <button
        onClick={() => handleShare('twitter')}
        disabled={sharing === 'twitter'}
        className={`
          ${sizeClasses[buttonSize]}
          bg-gradient-to-br from-gray-900 to-black
          hover:from-gray-800 hover:to-gray-900
          disabled:from-gray-950 disabled:to-black
          text-white rounded-lg flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          disabled:scale-100 disabled:opacity-50
          shadow-lg hover:shadow-gray-900/25
        `}
        title="Share to X"
      >
        {sharing === 'twitter' ? (
          <div className={`${iconSizes[buttonSize]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <svg className={iconSizes[buttonSize]} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )}
      </button>

      {/* Telegram Button (Third) */}
      <button
        onClick={() => handleShare('telegram')}
        disabled={sharing === 'telegram'}
        className={`
          ${sizeClasses[buttonSize]}
          bg-gradient-to-br from-blue-500 to-blue-600
          hover:from-blue-400 hover:to-blue-500
          disabled:from-blue-700 disabled:to-blue-800
          text-white rounded-lg flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          disabled:scale-100 disabled:opacity-50
          shadow-lg hover:shadow-blue-500/25
        `}
        title="Share to Telegram"
      >
        {sharing === 'telegram' ? (
          <div className={`${iconSizes[buttonSize]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <svg className={iconSizes[buttonSize]} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        )}
      </button>

      {/* Optional Labels */}
      {showLabels && (
        <span className="text-xs text-gray-400 ml-2">Share to:</span>
      )}
    </div>
  );
}