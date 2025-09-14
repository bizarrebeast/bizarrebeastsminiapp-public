'use client';

import React from 'react';
import { Lock, Crown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AccessTier } from '@/lib/empire';
import { useWallet } from '@/hooks/useWallet';

interface GatedFeatureProps {
  requiredTier: AccessTier;
  feature?: string;
  customMessage?: string;
  children: React.ReactNode;
  showUpgradePrompt?: boolean;
  blurContent?: boolean;
}

export function GatedFeature({ 
  requiredTier, 
  feature,
  customMessage,
  children, 
  showUpgradePrompt = true,
  blurContent = true 
}: GatedFeatureProps) {
  const { empireTier, empireRank, isConnected } = useWallet();
  
  // Get tier hierarchy
  const tierHierarchy: Record<AccessTier, number> = {
    [AccessTier.BIZARRE]: 5,
    [AccessTier.WEIRDO]: 4,
    [AccessTier.ODDBALL]: 3,
    [AccessTier.MISFIT]: 2,
    [AccessTier.NORMIE]: 1,
  };
  
  const userTierLevel = tierHierarchy[empireTier || AccessTier.NORMIE];
  const requiredTierLevel = tierHierarchy[requiredTier];
  const hasAccess = userTierLevel >= requiredTierLevel;
  
  // If user has access, render children normally
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Get tier display info
  const getTierInfo = (tier: AccessTier) => {
    switch(tier) {
      case AccessTier.BIZARRE:
        return { name: 'BIZARRE', range: 'Rank 1-25', color: 'text-gem-gold', icon: '👑' };
      case AccessTier.WEIRDO:
        return { name: 'Weirdo', range: 'Rank 26-50', color: 'text-gem-purple', icon: '🏆' };
      case AccessTier.ODDBALL:
        return { name: 'Oddball', range: 'Rank 51-100', color: 'text-gem-blue', icon: '⭐' };
      case AccessTier.MISFIT:
        return { name: 'Misfit', range: 'Rank 101-500', color: 'text-gem-crystal', icon: '✨' };
      default:
        return { name: 'Normie', range: 'Rank 501+', color: 'text-gray-400', icon: '' };
    }
  };
  
  const requiredInfo = getTierInfo(requiredTier);
  
  // Render locked state
  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className={blurContent ? 'blur-sm pointer-events-none opacity-50' : 'pointer-events-none opacity-50'}>
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4 max-w-sm">
          {/* Lock icon */}
          <div className="mb-3 flex justify-center">
            <div className="w-12 h-12 bg-dark-card border border-gem-crystal/30 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-gem-crystal" />
            </div>
          </div>
          
          {/* Tier requirement */}
          <div className="mb-2">
            <span className="text-2xl mr-2">{requiredInfo.icon}</span>
            <span className={`font-bold ${requiredInfo.color}`}>
              {requiredInfo.name} Tier Required
            </span>
          </div>
          
          <p className="text-xs text-gray-400 mb-3">
            {requiredInfo.range}
          </p>
          
          {/* Custom message or default */}
          <p className="text-sm text-gray-300 mb-4">
            {customMessage || `${feature || 'This feature'} is available for ${requiredInfo.name} tier and above.`}
          </p>
          
          {/* Current status */}
          {isConnected && empireRank ? (
            <div className="text-xs text-gray-400 mb-3">
              Your rank: <span className="text-white font-bold">#{empireRank}</span>
              {empireRank > 500 && (
                <p className="mt-1">Hold $BB tokens to join the Empire leaderboard</p>
              )}
            </div>
          ) : !isConnected ? (
            <div className="text-xs text-gray-400 mb-3">
              Connect wallet to check your Empire rank
            </div>
          ) : null}
          
          {/* Upgrade prompt */}
          {showUpgradePrompt && (
            <div className="flex flex-col gap-2">
              <Link
                href="/empire"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black text-xs font-semibold rounded hover:opacity-90 transition"
              >
                <TrendingUp className="w-3 h-3" />
                View Empire Leaderboard
              </Link>
              
              {!isConnected && (
                <button
                  onClick={() => {
                    // This will be handled by the wallet button
                    const walletBtn = document.querySelector('[data-wallet-button]');
                    if (walletBtn) (walletBtn as HTMLButtonElement).click();
                  }}
                  className="text-xs text-gem-crystal hover:text-gem-crystal/80 transition"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini version for inline gating (like individual stickers)
export function GatedBadge({ requiredTier }: { requiredTier: AccessTier }) {
  const { empireTier } = useWallet();
  
  const tierHierarchy: Record<AccessTier, number> = {
    [AccessTier.BIZARRE]: 5,
    [AccessTier.WEIRDO]: 4,
    [AccessTier.ODDBALL]: 3,
    [AccessTier.MISFIT]: 2,
    [AccessTier.NORMIE]: 1,
  };
  
  const userTierLevel = tierHierarchy[empireTier || AccessTier.NORMIE];
  const requiredTierLevel = tierHierarchy[requiredTier];
  const hasAccess = userTierLevel >= requiredTierLevel;
  
  if (hasAccess) return null;
  
  const tierColors = {
    [AccessTier.BIZARRE]: 'bg-gem-gold/20 text-gem-gold border-gem-gold/30',
    [AccessTier.WEIRDO]: 'bg-gem-purple/20 text-gem-purple border-gem-purple/30',
    [AccessTier.ODDBALL]: 'bg-gem-blue/20 text-gem-blue border-gem-blue/30',
    [AccessTier.MISFIT]: 'bg-gem-crystal/20 text-gem-crystal border-gem-crystal/30',
    [AccessTier.NORMIE]: 'bg-gray-700/20 text-gray-400 border-gray-600/30',
  };
  
  return (
    <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${tierColors[requiredTier]}`}>
      <Lock className="w-2.5 h-2.5 inline mr-0.5" />
      {requiredTier}
    </div>
  );
}