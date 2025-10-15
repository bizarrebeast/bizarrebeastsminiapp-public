'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, Clock, Gift, Sparkles } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

interface FlipStatus {
  canFlip: boolean;
  dailyFlipUsed: boolean;
  hasBonusSpins: boolean;
  bonusSpinsRemaining: number;
  bonusSpinReason: string | null;
  nextFlipTime: string;
  myEntries: number;
  userTier?: string;
  empireRank?: number | null;
  maxDailyFlips?: number;
  flipsUsedToday?: number;
  flipsRemaining?: number;
  reason?: string;
}

interface MonthlyPrize {
  name: string;
  description: string;
  imageUrl: string;
  value: string;
  drawingDate: string;
  totalEntries: number;
  totalParticipants: number;
}

export default function FlipBanner() {
  const { address } = useWallet();
  const { farcasterFid } = useUnifiedAuthStore();
  const [status, setStatus] = useState<FlipStatus | null>(null);
  const [monthlyPrize, setMonthlyPrize] = useState<MonthlyPrize | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilNextFlip, setTimeUntilNextFlip] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Load flip status
  useEffect(() => {
    if (address || farcasterFid) {
      loadStatus();
      loadMonthlyPrize();
    } else {
      setLoading(false);
    }
  }, [address, farcasterFid]);

  // Periodically refresh monthly prize data to show live entry counts
  useEffect(() => {
    if (!address && !farcasterFid) return;

    const interval = setInterval(() => {
      loadMonthlyPrize();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [address, farcasterFid]);

  // Countdown timer
  useEffect(() => {
    if (!status?.nextFlipTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const next = new Date(status.nextFlipTime).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeUntilNextFlip('Ready!');
        loadStatus(); // Refresh status
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilNextFlip(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.nextFlipTime]);

  // Show banner after data loads
  useEffect(() => {
    if (!loading && (status || monthlyPrize)) {
      setIsVisible(true);
    }
  }, [loading, status, monthlyPrize]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/flip/daily-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          farcasterFid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load flip status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyPrize = async () => {
    try {
      const response = await fetch('/api/flip/monthly-prize');
      if (response.ok) {
        const data = await response.json();
        if (data.hasPrize) {
          setMonthlyPrize({
            ...data.prize,
            totalEntries: data.stats.totalEntries,
            totalParticipants: data.stats.totalParticipants
          });
        }
      }
    } catch (err) {
      console.error('Failed to load monthly prize:', err);
    }
  };

  // Don't show if not authenticated or loading
  if (!address && !farcasterFid) return null;
  if (loading) return null;
  if (!isVisible) return null;

  return (
    <Link href="/flip">
      <div className="bg-gradient-to-r from-gem-pink/20 via-gem-gold/20 to-gem-crystal/20 border-2 border-gem-gold hover:border-gem-crystal rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-gem-gold/20 hover:scale-[1.01]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Prize Image */}
          {monthlyPrize?.imageUrl && (
            <div className="flex-shrink-0 mx-auto sm:mx-0 overflow-hidden rounded-lg border-2 border-gem-gold w-40 h-40 sm:w-24 sm:h-24 flex items-center justify-center">
              <img
                src={monthlyPrize.imageUrl}
                alt={monthlyPrize.name}
                className="w-full h-full object-cover object-center scale-125"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2 flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gem-gold/90 text-dark-bg rounded-full">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">DAILY FLIP</span>
              </div>
              {monthlyPrize && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/90 text-white rounded-full">
                  <Gift className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">REAL PRIZE</span>
                </div>
              )}
            </div>

            <h3 className="text-lg sm:text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent text-center sm:text-left">
              {status?.canFlip ? 'You Have Flips Ready!' : 'Daily Flips Recharging...'}
            </h3>

            {monthlyPrize && (
              <p className="text-xs sm:text-base text-gray-200 mb-3 text-center sm:text-left leading-relaxed">
                Flip for $BB (Beta) + Enter to win <span className="font-bold text-gem-gold">{monthlyPrize.name}</span>
                {monthlyPrize.name !== monthlyPrize.value && ` (${monthlyPrize.value})`}
              </p>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm">
              {/* Flips Status */}
              {status?.canFlip ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg whitespace-nowrap">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="font-bold text-green-300 text-xs sm:text-sm">
                      {status.flipsRemaining || 1} {(status.flipsRemaining || 1) === 1 ? 'Flip' : 'Flips'} Available
                    </span>
                  </div>
                  {status.hasBonusSpins && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gem-gold/20 border border-gem-gold/50 rounded-lg whitespace-nowrap">
                      <Gift className="w-4 h-4 text-gem-gold" />
                      <span className="font-bold text-gem-gold text-xs sm:text-sm">
                        +{status.bonusSpinsRemaining} Bonus
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-xs sm:text-sm">
                    Next flip in: <span className="font-bold text-gem-crystal">{timeUntilNextFlip}</span>
                  </span>
                </div>
              )}

              {/* Your Entries */}
              {status && status.myEntries > 0 && (
                <>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-300 text-xs sm:text-sm">
                    You have <span className="font-bold text-gem-gold">{status.myEntries}</span> {status.myEntries === 1 ? 'entry' : 'entries'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* CTA Arrow - Hidden on mobile for cleaner look */}
          <div className="hidden sm:flex flex-shrink-0 self-center">
            <div className="text-4xl text-gem-crystal animate-pulse">
              →
            </div>
          </div>
        </div>

        {/* Drawing Date - Bottom Row */}
        {monthlyPrize && (
          <div className="mt-4 pt-3 border-t border-gem-gold/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-300 text-center sm:text-left">
              <span>
                Drawing: <span className="font-semibold text-gem-crystal">
                  {new Date(monthlyPrize.drawingDate).toLocaleDateString()}
                </span>
              </span>
              <span className="text-gray-400">
                {monthlyPrize.totalEntries.toLocaleString()} total entries
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
