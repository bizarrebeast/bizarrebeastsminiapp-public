'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, Zap, Users, Info, Share2 } from 'lucide-react';
import { empireService, EmpireHolder, AccessTier } from '@/lib/empire';
import { ultimateShare } from '@/lib/sdk-ultimate';
import { sdk } from '@/lib/sdk-init';
import ShareButtons from '@/components/ShareButtons';

interface EnhancedHolder extends EmpireHolder {
  streakBased?: boolean;
  streakDays?: number;
}

export default function EmpirePage() {
  const [leaderboard, setLeaderboard] = useState<EnhancedHolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<EnhancedHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [streakData, setStreakData] = useState<Map<string, { best_streak: number, has_bizarre_tier_override: boolean }>>(new Map());

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await empireService.getLeaderboard();

      // Check for streak-based BIZARRE tier for top holders
      const streakChecks = new Map();
      const topHolders = data.holders.slice(0, 250);

      // Batch check streaks for efficiency
      await Promise.all(
        topHolders.map(async (holder) => {
          try {
            const response = await fetch(`/api/attestations/streak?wallet=${holder.address}`);
            if (response.ok) {
              const streak = await response.json();
              if (streak.has_bizarre_tier_override) {
                streakChecks.set(holder.address.toLowerCase(), {
                  best_streak: streak.best_streak,
                  has_bizarre_tier_override: true
                });
              }
            }
          } catch (error) {
            console.error('Error checking streak for', holder.address, error);
          }
        })
      );

      setStreakData(streakChecks);
      setLeaderboard(data.holders);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    setSearching(true);
    try {
      const result = await empireService.searchUser(searchQuery);

      // Check if user has streak-based BIZARRE tier
      if (result) {
        try {
          const response = await fetch(`/api/attestations/streak?wallet=${result.address}`);
          if (response.ok) {
            const streak = await response.json();
            if (streak.has_bizarre_tier_override) {
              (result as EnhancedHolder).streakBased = true;
              (result as EnhancedHolder).streakDays = streak.best_streak;
            }
          }
        } catch (error) {
          console.error('Error checking streak:', error);
        }
      }

      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleShareRank = async (holder: EmpireHolder) => {
    const tier = empireService.getUserTier(holder.rank);
    const tierEmoji =
      tier === AccessTier.BIZARRE ? '👹' :
      tier === AccessTier.WEIRDO ? '🤡' :
      tier === AccessTier.ODDBALL ? '🎭' :
      tier === AccessTier.MISFIT ? '👾' : '😐';
    
    const tierName =
      tier === AccessTier.BIZARRE ? 'BIZARRE' :
      tier === AccessTier.WEIRDO ? 'Weirdo' :
      tier === AccessTier.ODDBALL ? 'Oddball' :
      tier === AccessTier.MISFIT ? 'Misfit' : 'Normie';

    const formattedBalance = empireService.formatScore(holder.balance);
    
    const shareText = `I'm ranked #${holder.rank} in the BizarreBeasts ($BB) Empire! 🏆\n\nTier: ${tierName} ${tierEmoji}\nScore: ${formattedBalance}\n${holder.finalMultiplier > 1 ? `Boost: ${holder.finalMultiplier.toFixed(1)}x 🚀\n` : ''}\nJoin the Empire and climb the ranks! 👹\n\nPowered by $GLANKER\n\n#BizarreBeasts #BBEmpire`;
    
    // Build URL with embeds
    // Check if we're in Farcaster miniapp and use SDK if available
    try {
      const isInMiniApp = await sdk.isInMiniApp();

      if (isInMiniApp) {
        // Use SDK for native sharing in Farcaster (works on mobile!)
        await ultimateShare({
          text: shareText,
          embeds: ['https://empire.bizarrebeasts.io', 'https://bbapp.bizarrebeasts.io/empire'],
          channelKey: 'bizarrebeasts'
        });
      } else {
        // Browser fallback - use proper encoding for line breaks
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent('https://empire.bizarrebeasts.io')}&embeds[]=${encodeURIComponent('https://bbapp.bizarrebeasts.io/empire')}&channelKey=bizarrebeasts`;
        window.open(shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback - use proper encoding for line breaks
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent('https://empire.bizarrebeasts.io')}&embeds[]=${encodeURIComponent('https://bbapp.bizarrebeasts.io/empire')}&channelKey=bizarrebeasts`;
      window.open(shareUrl, '_blank');
    }
    
    // Mark ritual 9 as completed
    const today = new Date().toDateString();
    const stored = localStorage.getItem('bizarreRitualsData');
    let completedRituals: number[] = [];
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        completedRituals = data.rituals || [];
      }
    }
    
    // Add ritual 9 if not already completed
    if (!completedRituals.includes(9)) {
      completedRituals.push(9);
      localStorage.setItem('bizarreRitualsData', JSON.stringify({
        date: today,
        rituals: completedRituals
      }));
    }
  };

  const getTierColor = (rank: number, address?: string) => {
    // Check if user has streak-based BIZARRE tier
    if (address && streakData.has(address.toLowerCase())) {
      const data = streakData.get(address.toLowerCase());
      if (data?.has_bizarre_tier_override) {
        return 'text-gem-gold';
      }
    }

    const tier = empireService.getUserTier(rank);
    switch(tier) {
      case AccessTier.BIZARRE:
        return 'text-gem-gold';
      case AccessTier.WEIRDO:
        return 'text-gem-purple';
      case AccessTier.ODDBALL:
        return 'text-gem-blue';
      case AccessTier.MISFIT:
        return 'text-gem-crystal';
      default:
        return 'text-gray-400';
    }
  };

  const getTierBadge = (rank: number, address?: string) => {
    // Check if user has streak-based BIZARRE tier
    if (address && streakData.has(address.toLowerCase())) {
      const data = streakData.get(address.toLowerCase());
      if (data?.has_bizarre_tier_override) {
        return '👹';
      }
    }

    const tier = empireService.getUserTier(rank);
    const badges = {
      [AccessTier.BIZARRE]: '👹',
      [AccessTier.WEIRDO]: '🤡',
      [AccessTier.ODDBALL]: '🎭',
      [AccessTier.MISFIT]: '👾',
      [AccessTier.NORMIE]: '😐'
    };
    return badges[tier];
  };

  const getTierName = (rank: number, address?: string): string => {
    // Check if user has streak-based BIZARRE tier
    if (address && streakData.has(address.toLowerCase())) {
      const data = streakData.get(address.toLowerCase());
      if (data?.has_bizarre_tier_override) {
        return AccessTier.BIZARRE;
      }
    }

    return empireService.getUserTier(rank);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Title and Description */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
              Empire Leaderboard
            </h1>

            <p className="text-lg text-gray-300 max-w-4xl mx-auto px-4">
              Climb the ranks and unlock exclusive features based on your $BB holdings! See where you stand among the BizarreBeasts community and discover what premium content awaits at higher Empire positions.
              <br /><br />
              Your leaderboard position qualifies you for treasury distributions, NFT raffles, and other BIZARRE perks! Powered by EmpireBuilder.world ($GLANKER)
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search address or @username..."
                className="w-full bg-dark-card border border-gem-crystal/20 text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-gem-crystal/40"
              />
              <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Share Your Rank Section - Always Visible */}
          <div className="bg-gradient-to-r from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 border border-gem-gold/40 rounded-lg p-4 mb-6">
            {searchResult ? (
              <>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-gem-gold" />
                  Your Leaderboard Rank
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${getTierColor(searchResult.rank, searchResult.address)}`}>
                        #{searchResult.rank}
                      </span>
                      <div>
                        <p className="text-white font-medium">
                          {empireService.formatAddress(searchResult.address)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{empireService.formatScore(searchResult.balance)}</p>
                      <p className="text-gray-400 text-sm">{searchResult.finalMultiplier.toFixed(1)}x boost</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-400">Share your rank:</p>
                    <ShareButtons
                      customText={(() => {
                        const tier = (searchResult as EnhancedHolder).streakBased ? AccessTier.BIZARRE : empireService.getUserTier(searchResult.rank);
                        const tierEmoji =
                          tier === AccessTier.BIZARRE ? '🤪' :
                          tier === AccessTier.WEIRDO ? '🤡' :
                          tier === AccessTier.ODDBALL ? '🎭' :
                          tier === AccessTier.MISFIT ? '👾' : '😐';
                        const tierName =
                          tier === AccessTier.BIZARRE ? 'BIZARRE' :
                          tier === AccessTier.WEIRDO ? 'Weirdo' :
                          tier === AccessTier.ODDBALL ? 'Oddball' :
                          tier === AccessTier.MISFIT ? 'Misfit' : 'Normie';
                        const formattedBalance = empireService.formatScore(searchResult.balance);

                        // Return the full text that will be formatted per platform
                        // Note: Hashtags removed for X/Twitter per 2025 best practices
                        return `I'm ranked #${searchResult.rank} in the BizarreBeasts ($BB) Empire! 🏆\n\nTier: ${tierName} ${tierEmoji}\nScore: ${formattedBalance}\n${searchResult.finalMultiplier > 1 ? `Boost: ${searchResult.finalMultiplier.toFixed(1)}x 🚀\n` : ''}\nJoin the Empire and climb the ranks! 👹\n\nPowered by $GLANKER`;
                      })()}
                      shareType="default"
                      buttonSize="md"
                      showLabels={false}
                      contextUrl="https://bbapp.bizarrebeasts.io/empire"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-gem-gold" />
                  Share Your Leaderboard Rank
                </h3>
                <p className="text-gray-300 text-sm">
                  Search for your wallet or @username above to discover your rank and share it with the community! Powered by $GLANKER
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-dark-card border border-gem-pink/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gem-pink mt-0.5" />
              <div className="text-gray-300 text-sm space-y-1">
                <p className="font-semibold text-white">How Empire Ranking Works:</p>
                <p>• The Empire leaderboard ranks holders based on their $BB tokens and boost multipliers</p>
                <p>• Higher positions unlock more features and exclusive content in the BizarreBeasts miniapp</p>
                <p>• Connect your wallet to see your rank and unlock features based on your Empire position</p>
                <p>• Boost multipliers come from holding other tokens, NFTs, and participating in the ecosystem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Showcase */}
        {!loading && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {leaderboard.slice(0, 3).map((holder, index) => (
              <div
                key={holder.address}
                className={`bg-dark-card border rounded-lg p-6 relative overflow-hidden ${
                  index === 0 ? 'border-gem-gold/40 bg-gradient-to-br from-gem-gold/10 to-transparent' :
                  index === 1 ? 'border-gray-400/40 bg-gradient-to-br from-gray-400/10 to-transparent' :
                  'border-gem-pink/40 bg-gradient-to-br from-gem-pink/10 to-transparent'
                }`}
              >
                <div className="absolute top-2 right-2 text-4xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-white">#{holder.rank}</p>
                  <div>
                    <p className="text-white font-medium truncate">
                      {holder.farcasterUsername ? (
                        <span className="text-gem-crystal">@{holder.farcasterUsername}</span>
                      ) : (
                        empireService.formatAddress(holder.address)
                      )}
                    </p>
                    {holder.farcasterUsername && (
                      <p className="text-gray-500 text-xs truncate">{empireService.formatAddress(holder.address)}</p>
                    )}
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    {empireService.formatScore(holder.balance)}
                  </p>
                  <p className="text-gray-400 text-sm">{holder.finalMultiplier.toFixed(1)}x multiplier</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Leaderboard Table */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-gem-crystal/20 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-3 text-gray-400 font-medium text-xs sm:text-sm bg-dark-bg">Rank</th>
                  <th className="text-center px-2 sm:px-4 py-3 text-gray-400 font-medium text-xs sm:text-sm bg-dark-bg">Tier</th>
                  <th className="text-left px-2 sm:px-4 py-3 text-gray-400 font-medium text-xs sm:text-sm bg-dark-bg">Address/Name</th>
                  <th className="text-right px-2 sm:px-4 py-3 text-gray-400 font-medium text-xs sm:text-sm bg-dark-bg">Score</th>
                  <th className="text-right px-2 sm:px-4 py-3 text-gray-400 font-medium text-xs sm:text-sm hidden sm:table-cell bg-dark-bg">Boosters</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  leaderboard.slice(0, 250).map((holder) => (
                    <tr key={holder.address} className="border-b border-gray-800 hover:bg-dark-card/50 transition">
                      <td className="px-2 sm:px-4 py-3">
                        <span className={`font-bold text-xs sm:text-base ${getTierColor(holder.rank, holder.address)}`}>
                          {getTierBadge(holder.rank, holder.address)} {holder.rank}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] sm:text-xs font-semibold uppercase ${getTierColor(holder.rank, holder.address)}`}>
                            {getTierName(holder.rank, holder.address)}
                          </span>
                          {streakData.has(holder.address.toLowerCase()) && streakData.get(holder.address.toLowerCase())?.has_bizarre_tier_override && (
                            <span className="text-[8px] text-gem-gold/80">🔥 100-day streak</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div>
                          <p className="text-white font-medium text-xs sm:text-base truncate">
                            {holder.farcasterUsername ? (
                              <span className="text-gem-crystal">@{holder.farcasterUsername}</span>
                            ) : (
                              empireService.formatAddress(holder.address)
                            )}
                          </p>
                          {holder.farcasterUsername && (
                            <p className="text-gray-500 text-[10px] sm:text-xs truncate">{empireService.formatAddress(holder.address)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right">
                        <p className="text-white font-semibold text-xs sm:text-base">{empireService.formatScore(holder.balance)}</p>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right hidden sm:table-cell">
                        <p className="text-gray-300">{holder.finalMultiplier.toFixed(1)}x</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && leaderboard.length > 250 && (
            <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-800">
              Showing top 250 holders • Total: {leaderboard.length} holders
            </div>
          )}
        </div>

        {/* Tier Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.values(AccessTier).map((tier) => (
            <div key={tier} className="bg-dark-card border border-gem-pink/20 rounded-lg p-4">
              <h4 className={`font-semibold mb-2 capitalize ${
                tier === AccessTier.BIZARRE ? 'text-gem-gold' :
                tier === AccessTier.WEIRDO ? 'text-gem-purple' :
                tier === AccessTier.ODDBALL ? 'text-gem-blue' :
                tier === AccessTier.MISFIT ? 'text-gem-crystal' :
                'text-gray-400'
              }`}>
                {tier} Tier
              </h4>
              <div className="text-3xl mb-2">
                {tier === AccessTier.BIZARRE ? '👹' :
                 tier === AccessTier.WEIRDO ? '🤡' :
                 tier === AccessTier.ODDBALL ? '🎭' :
                 tier === AccessTier.MISFIT ? '👾' : '😐'}
              </div>
              <p className="text-gray-400 text-xs mb-2">
                {tier === AccessTier.BIZARRE ? 'Rank 1-25 or 100-day streak' :
                 tier === AccessTier.WEIRDO ? 'Rank 26-50' :
                 tier === AccessTier.ODDBALL ? 'Rank 51-100' :
                 tier === AccessTier.MISFIT ? 'Rank 101-500' :
                 'Rank 501+'}
              </p>
              <ul className="text-xs text-gray-300 space-y-1">
                {empireService.getTierBenefits(tier).slice(0, 3).map((benefit, i) => (
                  <li key={i}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}