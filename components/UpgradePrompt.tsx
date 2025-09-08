'use client';

import React, { useState, useEffect } from 'react';
import { X, Crown, Zap, TrendingUp, ExternalLink, Sparkles } from 'lucide-react';
import { AccessTier, empireService, EmpireHolder } from '@/lib/empire';
import { useWallet } from '@/hooks/useWallet';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: AccessTier;
  featureName: string;
  currentTier?: AccessTier;
}

// Token and marketplace links
const SWAP_LINKS = {
  uniswap: 'https://app.uniswap.org/swap?outputCurrency=0x0520bf1d3cEE163407aDA79109333aB1599b4004&chain=base',
  empireBoosters: 'https://www.empirebuilder.world/empire/0x0520bf1d3cEE163407aDA79109333aB1599b4004',
};

// Known booster collections (you can expand this)
const KNOWN_BOOSTERS = [
  { name: 'Empire Booster', multiplier: '2x', type: 'NFT' },
  { name: 'LP Token', multiplier: '1.5x', type: 'ERC20' },
];

export default function UpgradePrompt({
  isOpen,
  onClose,
  requiredTier,
  featureName,
  currentTier = AccessTier.VISITOR,
}: UpgradePromptProps) {
  const { address } = useWallet();
  const [userData, setUserData] = useState<EmpireHolder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address && isOpen) {
      setLoading(true);
      empireService.getUserByAddress(address).then(data => {
        setUserData(data);
        setLoading(false);
      });
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const getTierInfo = (tier: AccessTier) => {
    switch(tier) {
      case AccessTier.ELITE:
        return { 
          name: 'Elite', 
          icon: '👑', 
          color: 'from-gem-gold to-yellow-500',
          requirement: 'Top 10 Empire Rank',
          benefits: [
            'All sticker collections',
            'No watermarks',
            'Upload custom backgrounds',
            'Premium features',
          ]
        };
      case AccessTier.CHAMPION:
        return { 
          name: 'Champion', 
          icon: '🏆', 
          color: 'from-gem-purple to-purple-500',
          requirement: 'Top 50 Empire Rank',
          benefits: [
            'Most sticker collections',
            'No watermarks',
            'Upload custom backgrounds',
            'Advanced features',
          ]
        };
      case AccessTier.VETERAN:
        return { 
          name: 'Veteran', 
          icon: '⭐', 
          color: 'from-gem-blue to-blue-500',
          requirement: 'Top 100 Empire Rank',
          benefits: [
            'Premium sticker collections',
            'Watermark optional',
            'Special backgrounds',
          ]
        };
      case AccessTier.MEMBER:
        return { 
          name: 'Member', 
          icon: '💎', 
          color: 'from-gem-crystal to-cyan-500',
          requirement: 'Top 500 Empire Rank',
          benefits: [
            'Basic sticker collections',
            'Some backgrounds',
          ]
        };
      default:
        return { 
          name: 'Visitor', 
          icon: '👤', 
          color: 'from-gray-500 to-gray-600',
          requirement: 'No rank required',
          benefits: ['Basic features only']
        };
    }
  };

  const requiredInfo = getTierInfo(requiredTier);
  const currentInfo = getTierInfo(currentTier);

  // Calculate what's needed to reach required tier
  const calculateRequirement = () => {
    if (!userData) return null;
    
    const targetRank = requiredTier === AccessTier.ELITE ? 10 :
                      requiredTier === AccessTier.CHAMPION ? 50 :
                      requiredTier === AccessTier.VETERAN ? 100 :
                      requiredTier === AccessTier.MEMBER ? 500 : 999999;
    
    const currentRank = userData.rank || 999999;
    const ranksNeeded = Math.max(0, currentRank - targetRank);
    
    return {
      currentRank,
      targetRank,
      ranksNeeded,
      currentBalance: empireService.formatScore(userData.balance),
      currentMultiplier: userData.finalMultiplier.toFixed(2),
      boosts: userData.appliedBoosts || [],
    };
  };

  const requirement = calculateRequirement();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-lg w-full bg-dark-card border border-gem-crystal/30 rounded-xl p-6 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{requiredInfo.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {requiredInfo.name} Tier Required
          </h2>
          <p className="text-gray-400">
            Unlock "{featureName}" by reaching {requiredInfo.name} tier
          </p>
        </div>

        {/* Current Status */}
        {userData && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Your Status</span>
              <span className={`text-sm font-semibold bg-gradient-to-r ${currentInfo.color} bg-clip-text text-transparent`}>
                {currentInfo.name} Tier
              </span>
            </div>
            {requirement && (
              <>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Empire Rank:</span>
                    <span className="text-white">#{requirement.currentRank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-white">{requirement.currentBalance} $BB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Multiplier:</span>
                    <span className="text-gem-crystal">{requirement.currentMultiplier}x</span>
                  </div>
                </div>
                
                {/* Active Boosters */}
                {requirement.boosts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Active Boosters:</p>
                    <div className="flex flex-wrap gap-1">
                      {requirement.boosts.map((boost, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gem-purple/20 text-gem-purple text-xs rounded">
                          {boost.multiplier}x
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress to next tier */}
                {requirement.ranksNeeded > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      Need to climb <span className="text-gem-gold font-semibold">{requirement.ranksNeeded} ranks</span> to reach {requiredInfo.name}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Benefits */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">
            {requiredInfo.name} Benefits:
          </h3>
          <ul className="space-y-1">
            {requiredInfo.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <Sparkles className="w-3 h-3 text-gem-crystal" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white mb-2">
            How to Upgrade:
          </h3>
          
          {/* Buy BB Tokens */}
          <a
            href={SWAP_LINKS.uniswap}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gem-gold/20 to-gem-crystal/20 border border-gem-gold/30 rounded-lg hover:border-gem-gold/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gem-gold" />
              <div>
                <p className="text-sm font-semibold text-white">Buy $BB Tokens</p>
                <p className="text-xs text-gray-400">Increase your balance on Uniswap</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </a>

          {/* Get Empire Boosters */}
          <a
            href={SWAP_LINKS.empireBoosters}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gem-purple/20 to-gem-blue/20 border border-gem-purple/30 rounded-lg hover:border-gem-purple/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gem-purple" />
              <div>
                <p className="text-sm font-semibold text-white">Get $BB Empire Boosters</p>
                <p className="text-xs text-gray-400">Multiply your score with NFT boosters</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </a>

          {/* View Empire Page */}
          <a
            href="/empire"
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-white">View Empire Rankings</p>
                <p className="text-xs text-gray-400">Check your Empire rank and boosters</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </a>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your Empire rank updates automatically based on your $BB holdings and boosters
        </p>
      </div>
    </div>
  );
}