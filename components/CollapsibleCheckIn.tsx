'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Gift, AlertCircle, Lock } from 'lucide-react';
import CheckIn from '@/components/CheckIn';
import RewardsTable from '@/components/RewardsTable';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { AccessTier } from '@/lib/empire';

interface CollapsibleCheckInProps {
  completedRituals: number;
}

export default function CollapsibleCheckIn({ completedRituals }: CollapsibleCheckInProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    walletAddress,
    walletConnected,
    empireTier,
    empireRank,
    farcasterConnected,
    farcasterUsername,
    farcasterFid,
    refreshProfile
  } = useUnifiedAuthStore();

  // Debug logging
  console.log('[CollapsibleCheckIn] Empire data:', {
    empireTier,
    empireRank,
    tierType: typeof empireTier,
    isNormie: empireTier === AccessTier.NORMIE,
    isBizarre: empireTier === AccessTier.BIZARRE,
    walletAddress
  });

  // Refresh profile when wallet is connected but Empire data is missing
  useEffect(() => {
    if (walletConnected && walletAddress && (!empireTier || empireTier === AccessTier.NORMIE) && !empireRank) {
      console.log('[CollapsibleCheckIn] Fetching Empire data for wallet:', walletAddress);
      refreshProfile();
    }
  }, [walletConnected, walletAddress, empireTier, empireRank, refreshProfile]);

  // Remove auto-open - keep it collapsed by default
  // useEffect(() => {
  //   if (completedRituals >= 3 && walletConnected && empireTier !== AccessTier.NORMIE) {
  //     setIsOpen(true);
  //   }
  // }, [completedRituals, walletConnected, empireTier]);

  // Determine eligibility status
  const hasCompletedRituals = completedRituals >= 3;
  const hasWallet = walletConnected;
  // Check for empire rank - handle both uppercase and lowercase tier names
  const hasEmpireRank = (
    empireTier &&
    empireTier.toLowerCase() !== AccessTier.NORMIE &&
    empireTier.toLowerCase() !== 'normie'
  ) || (
    empireRank !== null &&
    empireRank !== undefined &&
    empireRank > 0
  );
  const isEligible = hasCompletedRituals && hasWallet && hasEmpireRank;

  // Get status message
  const getStatusMessage = () => {
    if (!hasCompletedRituals) {
      return {
        icon: '🔒',
        text: `Complete ${3 - completedRituals} more ritual${3 - completedRituals > 1 ? 's' : ''} to unlock`,
        color: 'text-gray-400'
      };
    }
    if (!hasWallet) {
      return {
        icon: '👛',
        text: 'Connect wallet to unlock check-ins',
        color: 'text-gem-gold'
      };
    }
    if (!hasEmpireRank) {
      return {
        icon: '📊',
        text: 'Rank up in Empire to unlock rewards',
        color: 'text-gem-crystal'
      };
    }
    return {
      icon: '✅',
      text: 'Check-ins unlocked! Claim your daily rewards',
      color: 'text-gem-crystal'
    };
  };

  const status = getStatusMessage();

  return (
    <div className="mb-12">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gradient-to-br from-dark-card via-dark-card ${
          isEligible ? 'to-gem-gold/10' : 'to-gem-crystal/5'
        } border ${
          isEligible ? 'border-gem-gold/30' : 'border-gem-crystal/20'
        } rounded-xl p-6 transition-all duration-300 hover:border-opacity-50`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">☀️</div>
            <div className="text-left">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                Daily Check-In Rewards
              </h2>
              <p className={`text-sm ${status.color} mt-1`}>
                <span className="mr-2">{status.icon}</span>
                {status.text}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                hasCompletedRituals ? 'bg-gem-crystal/20 text-gem-crystal' : 'bg-dark-bg text-gray-500'
              }`}>
                {completedRituals}/3 Rituals
              </div>

              {hasWallet && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hasEmpireRank ? 'bg-gem-gold/20 text-gem-gold' : 'bg-dark-bg text-gray-500'
                }`}>
                  {hasEmpireRank ? (empireTier || 'RANKED') : 'Not Ranked'}
                </div>
              )}
            </div>

            {/* Chevron */}
            <div className="text-gem-crystal">
              {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {/* How It Works Section */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              💎 How Daily Check-In Rewards Work
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-bg/50 rounded-lg">
                <div className="text-2xl mb-2">1️⃣</div>
                <h4 className="font-semibold text-gem-crystal mb-2">Complete 3 Rituals</h4>
                <p className="text-xs text-gray-400">Finish any 3 daily rituals to unlock eligibility</p>
              </div>

              <div className="text-center p-4 bg-dark-bg/50 rounded-lg">
                <div className="text-2xl mb-2">2️⃣</div>
                <h4 className="font-semibold text-gem-gold mb-2">Get Empire Rank</h4>
                <p className="text-xs text-gray-400">Hold $BB tokens to rank up in the Empire</p>
              </div>

              <div className="text-center p-4 bg-dark-bg/50 rounded-lg">
                <div className="text-2xl mb-2">3️⃣</div>
                <h4 className="font-semibold text-gem-pink mb-2">Earn $BB Daily</h4>
                <p className="text-xs text-gray-400">Check in daily and claim rewards every 5 days!</p>
              </div>
            </div>

            {/* Empire Rank Notice - Only show if not ranked */}
            {!hasEmpireRank && hasCompletedRituals && hasWallet && (
              <div className="mt-4 p-4 bg-gradient-to-r from-gem-crystal/10 to-gem-gold/10 rounded-lg border border-gem-gold/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gem-gold flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gem-gold mb-1">Empire Rank Required</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      You need to hold $BB tokens to rank up in the Empire and unlock check-in rewards.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open('/empire', '_blank')}
                        className="px-4 py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg font-semibold text-sm rounded-lg hover:opacity-90 transition-all"
                      >
                        View Empire Ranks
                      </button>
                      <button
                        onClick={() => window.open('/swap', '_blank')}
                        className="px-4 py-2 bg-dark-bg border border-gem-crystal/30 text-gem-crystal font-semibold text-sm rounded-lg hover:bg-gem-crystal/10 transition-all"
                      >
                        Get $BB Tokens
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Farcaster Connection Status */}
            {farcasterConnected && (
              <div className="mt-4 bg-dark-card border border-gem-crystal/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-gem-crystal">✅</span>
                  <p className="text-sm text-gray-300">
                    Signed in as <span className="font-bold text-white">@{farcasterUsername}</span> (FID: {farcasterFid}) - Your shares will be verified automatically
                  </p>
                </div>
              </div>
            )}

            <div className="text-center mt-4">
              <p className="text-xs text-gray-400">
                <span className="text-gem-gold font-semibold">🧪 Beta Testing Phase:</span> Be among the first to earn $BB rewards on Base!
              </p>
            </div>
          </div>

          {/* Rewards Table */}
          <div>
            <RewardsTable />
          </div>

          {/* Check-In Component */}
          <div>
            <CheckIn
              userTier={empireTier as any || 'NORMIE'}
              completedRituals={completedRituals}
            />
          </div>
        </div>
      )}
    </div>
  );
}