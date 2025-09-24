'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { isBetaTester, BETA_BENEFITS, BETA_PHASE_ACTIVE } from '@/lib/beta-testers';

export function EmpireBadges() {
  const { isConnected, address, empireTier } = useWallet();

  if (!isConnected || !address) {
    return null;
  }

  const getTierBadge = () => {
    switch(empireTier) {
      case AccessTier.BIZARRE:
        return { emoji: '👹', name: 'BIZARRE' };
      case AccessTier.WEIRDO:
        return { emoji: '🤡', name: 'WEIRDO' };
      case AccessTier.ODDBALL:
        return { emoji: '🎭', name: 'ODDBALL' };
      case AccessTier.MISFIT:
        return { emoji: '👾', name: 'MISFIT' };
      default:
        return null;
    }
  };

  const tierBadge = getTierBadge();
  const isBeta = BETA_PHASE_ACTIVE && isBetaTester(address);

  if (!tierBadge && !isBeta) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Beta Tester Badge */}
      {isBeta && (
        <div
          className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-card rounded-lg cursor-default relative overflow-hidden group"
          title={`${BETA_BENEFITS.badgeText} - ${BETA_BENEFITS.specialMessage}`}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded-lg" />
          <div className="absolute inset-[2px] bg-dark-card rounded-lg" />

          {/* Content */}
          <div className="relative flex items-center gap-1">
            <span className="text-sm">{BETA_BENEFITS.badge}</span>
            <span className="hidden sm:inline bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-semibold">BETA</span>
          </div>
        </div>
      )}

      {/* Empire Tier Badge */}
      {tierBadge && (
        <div
          className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-card rounded-lg cursor-default relative overflow-hidden group"
          title={`Empire Tier: ${tierBadge.name}`}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded-lg" />
          <div className="absolute inset-[2px] bg-dark-card rounded-lg" />

          {/* Content */}
          <div className="relative flex items-center gap-1">
            <span className="text-sm">{tierBadge.emoji}</span>
            <span className="hidden sm:inline bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-semibold">
              {tierBadge.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}