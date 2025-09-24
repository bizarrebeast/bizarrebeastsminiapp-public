'use client';

import React, { useState } from 'react';
import { SharePlatform, shareToSocial, shareMemeWithImage, SHARE_TEMPLATES, formatTextForPlatform } from '@/lib/social-sharing';
import { shareMemeToFarcaster } from '@/lib/farcaster';
import { ultimateShare } from '@/lib/sdk-ultimate';
import { sdk } from '@/lib/sdk-init';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

interface ShareButtonsProps {
  imageDataUrl?: string;
  customText?: string;
  shareType?: 'default' | 'meme' | 'rank' | 'ritual' | 'checkin' | 'claim' | 'milestone5' | 'milestone15' | 'milestone30' | 'streakbreak' | 'contest' | 'contestEntry' | 'contestPosition' | 'contestWinner';
  rank?: number;
  ritualData?: {
    id: number;
    title: string;
    description: string;
    actionUrl?: string;
  };
  checkInData?: {
    streak: number;
    tierReward: string; // e.g., "100k", "50k"
    streakMessage: string;
  };
  claimData?: {
    amount: string; // e.g., "500,000"
    totalEarned: string;
    tierMessage: string;
  };
  milestoneData?: {
    reward?: string; // For 5-day
    bonus?: string; // For 15-day
    totalRewards?: string; // For 30-day
    bestStreak?: number; // For streak break
  };
  contestData?: {
    name: string;
    description?: string;
    timeLeft?: string;
    prize?: string;
    position?: number;
    score?: string | number;
  };
  className?: string;
  showLabels?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  contextUrl?: string; // Optional: specific URL for the current page/content
  onVerified?: () => void; // Callback when share is verified
}

export default function ShareButtons({
  imageDataUrl,
  customText,
  shareType = 'default',
  rank,
  ritualData,
  checkInData,
  claimData,
  milestoneData,
  contestData,
  className = '',
  showLabels = true,
  buttonSize = 'md',
  contextUrl,
  onVerified
}: ShareButtonsProps) {
  const [sharing, setSharing] = useState<SharePlatform | null>(null);
  const { userId, walletAddress, farcasterFid } = useUnifiedAuthStore();

  // Track share with our verification system
  const trackShare = async (platform: SharePlatform, shareText: string, shareUrl: string) => {
    try {
      const response = await fetch('/api/shares/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          shareType: shareType === 'contestEntry' ? 'contest_entry' :
                    shareType === 'contestPosition' ? 'contest_position' :
                    shareType === 'contestWinner' ? 'contest_winner' :
                    shareType,
          sharePlatform: platform,
          contentId: ritualData?.id?.toString() || contestData?.name,
          contentData: {
            ritualData,
            checkInData,
            claimData,
            milestoneData,
            contestData,
            rank
          },
          shareUrl,
          shareText,
          walletAddress,
          farcasterFid
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Share tracked:', result.shareId);

        // Auto-verify for eligible platforms
        if (platform === 'farcaster' || platform === 'telegram') {
          const verifyResponse = await fetch('/api/shares/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              shareId: result.shareId,
              platform,
              verificationData: platform === 'telegram' ? { miniapp: true } : {}
            })
          });

          const verifyResult = await verifyResponse.json();
          if (verifyResult.success && verifyResult.verified) {
            console.log('Share verified:', verifyResult.pointsAwarded, 'points awarded');
            // Call the onVerified callback if provided (for ritual completion)
            if (onVerified) {
              onVerified();
            }
          }
        }
      }
    } catch (error) {
      console.error('Share tracking failed:', error);
      // Don't block sharing if tracking fails
    }
  };

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
          // Check-in placeholders
          if (checkInData && shareType === 'checkin') {
            shareText = shareText.replace('{streak}', checkInData.streak.toString());
            shareText = shareText.replace('{tierReward}', checkInData.tierReward);
            shareText = shareText.replace('{streakMessage}', checkInData.streakMessage);
          }
          // Claim placeholders
          if (claimData && shareType === 'claim') {
            shareText = shareText.replace('{amount}', claimData.amount);
            shareText = shareText.replace('{totalEarned}', claimData.totalEarned);
            shareText = shareText.replace('{tierMessage}', claimData.tierMessage);
          }
          // Milestone placeholders
          if (milestoneData) {
            if (shareType === 'milestone5' && milestoneData.reward) {
              shareText = shareText.replace('{reward}', milestoneData.reward);
            }
            if (shareType === 'milestone15' && milestoneData.bonus) {
              shareText = shareText.replace('{bonus}', milestoneData.bonus);
            }
            if (shareType === 'milestone30' && milestoneData.totalRewards) {
              shareText = shareText.replace('{totalRewards}', milestoneData.totalRewards);
            }
            if (shareType === 'streakbreak' && milestoneData.bestStreak) {
              shareText = shareText.replace('{bestStreak}', milestoneData.bestStreak.toString());
            }
          }
          // Contest placeholders for Farcaster
          if (contestData && (shareType === 'contest' || shareType === 'contestEntry' || shareType === 'contestPosition' || shareType === 'contestWinner')) {
            shareText = shareText.replace(/\{name\}/g, contestData.name);
            // Description removed from all platforms to keep shares concise
            if (contestData.timeLeft) {
              shareText = shareText.replace(/\{timeLeft\}/g, contestData.timeLeft);
            }
            if (contestData.prize) {
              shareText = shareText.replace(/\{prize\}/g, contestData.prize);
            }
            if (contestData.position) {
              shareText = shareText.replace(/#\{position\}/g, `#${contestData.position}`);
            }
            if (contestData.score) {
              shareText = shareText.replace(/\{score\}/g, contestData.score.toString());
            }
          }
        }

        // For Farcaster, keep hashtags in the text if they exist
        // They've already been removed from X/Twitter and Telegram custom texts

        // Determine the URL to share based on context
        // For rituals, ALWAYS use individual ritual pages for proper hero images
        let shareUrl = contextUrl || 'https://bbapp.bizarrebeasts.io';
        if (shareType === 'ritual' && ritualData?.id) {
          // Always use the ritual detail page for rituals to get the correct hero image
          // Add cache-busting parameter to force refresh
          const cacheVersion = Math.floor(Date.now() / 1000 / 3600); // Changes hourly
          shareUrl = `https://bbapp.bizarrebeasts.io/rituals/${ritualData.id}?t=${cacheVersion}`;
        }
        const finalShareText = shareText || SHARE_TEMPLATES.farcaster.default;

        // Debug logging for shares
        if (shareType === 'ritual' && ritualData) {
          console.log('🚀 RITUAL SHARE DEBUG:');
          console.log(`  Ritual: ${ritualData.title}`);
          console.log(`  Share URL: ${shareUrl}`);
          console.log(`  OG Image URL: https://bbapp.bizarrebeasts.io/api/og/ritual/${ritualData.id}`);
          console.log(`  This will fetch metadata from: /rituals/${ritualData.id}`);
          console.log('  Note: If wrong image shows, Farcaster is caching old metadata.');
        }

        if (isInMiniApp) {
          // Use ultimateShare for native Farcaster sharing (works on mobile!)
          await ultimateShare({
            text: finalShareText,
            embeds: [shareUrl],
            channelKey: 'bizarrebeasts'
          });
        } else {
          // Fallback to opening Warpcast compose for browser/desktop users
          // Use shareToSocial instead of shareMemeToFarcaster to ensure URL embeds
          await shareToSocial({
            platform: 'farcaster',
            text: finalShareText,
            url: shareUrl,
            channelKey: 'bizarrebeasts'
          });
        }

        // Track the share after successful sharing
        await trackShare(platform, finalShareText, shareUrl);
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
          // Check-in placeholders
          if (checkInData && shareType === 'checkin') {
            text = text.replace('{streak}', checkInData.streak.toString());
            text = text.replace('{tierReward}', checkInData.tierReward);
            text = text.replace('{streakMessage}', checkInData.streakMessage);
          }
          // Claim placeholders
          if (claimData && shareType === 'claim') {
            text = text.replace('{amount}', claimData.amount);
            text = text.replace('{totalEarned}', claimData.totalEarned);
            text = text.replace('{tierMessage}', claimData.tierMessage);
          }
          // Milestone placeholders
          if (milestoneData) {
            if (shareType === 'milestone5' && milestoneData.reward) {
              text = text.replace('{reward}', milestoneData.reward);
            }
            if (shareType === 'milestone15' && milestoneData.bonus) {
              text = text.replace('{bonus}', milestoneData.bonus);
            }
            if (shareType === 'milestone30' && milestoneData.totalRewards) {
              text = text.replace('{totalRewards}', milestoneData.totalRewards);
            }
            if (shareType === 'streakbreak' && milestoneData.bestStreak) {
              text = text.replace('{bestStreak}', milestoneData.bestStreak.toString());
            }
          }
          // Contest placeholders
          if (contestData && (shareType === 'contest' || shareType === 'contestEntry' || shareType === 'contestPosition' || shareType === 'contestWinner')) {
            text = text.replace(/\{name\}/g, contestData.name);
            // Don't include description in shares - it's too long
            if (contestData.timeLeft) {
              text = text.replace(/\{timeLeft\}/g, contestData.timeLeft);
            }
            if (contestData.prize) {
              text = text.replace(/\{prize\}/g, contestData.prize);
            }
            if (contestData.position) {
              text = text.replace(/#\{position\}/g, `#${contestData.position}`);
            }
            if (contestData.score) {
              text = text.replace(/\{score\}/g, contestData.score.toString());
            }
          }
        }

        // Remove hashtags for X/Twitter and Telegram (2025 best practices)
        if (platform === 'twitter' || platform === 'telegram') {
          // Remove common hashtags from the text
          text = text?.replace(/#BizarreBeasts/g, '')
            .replace(/#BBRituals/g, '')
            .replace(/#BBEmpire/g, '')
            .replace(/#BBFeaturedRitual/g, '')
            .replace(/#BB\b/g, '') // Remove #BB but keep $BB
            .replace(/\s+$/gm, '') // Remove trailing spaces from each line
            .trim();
          // Note: Preserving all line breaks for proper formatting
        }

        // Format text for specific platform (handles, $BB spacing)
        if (text) {
          text = formatTextForPlatform(text, platform);
        }

        // For Twitter and Telegram - use contextUrl if provided
        // For rituals, use individual ritual pages
        let shareUrl = contextUrl || 'https://bbapp.bizarrebeasts.io';
        if (!contextUrl && shareType === 'ritual' && ritualData?.id) {
          shareUrl = `https://bbapp.bizarrebeasts.io/rituals/${ritualData.id}`;
        }

        await shareToSocial({
          platform,
          text,
          url: shareUrl,
          hashtags: undefined, // Removed hashtags for X/Twitter per 2025 best practices
        });

        // Track the share after successful sharing
        await trackShare(platform, text || '', shareUrl);
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