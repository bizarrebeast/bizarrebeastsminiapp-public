'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, Zap, Users, Info } from 'lucide-react';
import { empireService, EmpireHolder, AccessTier } from '@/lib/empire';

export default function EmpirePage() {
  const [leaderboard, setLeaderboard] = useState<EmpireHolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<EmpireHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await empireService.getLeaderboard();
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
      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const getTierColor = (rank: number) => {
    const tier = empireService.getUserTier(rank);
    switch(tier) {
      case AccessTier.ELITE:
        return 'text-gem-gold';
      case AccessTier.CHAMPION:
        return 'text-gem-purple';
      case AccessTier.VETERAN:
        return 'text-gem-blue';
      case AccessTier.MEMBER:
        return 'text-gem-crystal';
      default:
        return 'text-gray-400';
    }
  };

  const getTierBadge = (rank: number) => {
    const tier = empireService.getUserTier(rank);
    const badges = {
      [AccessTier.ELITE]: '👑',
      [AccessTier.CHAMPION]: '🏆',
      [AccessTier.VETERAN]: '⭐',
      [AccessTier.MEMBER]: '✨',
      [AccessTier.VISITOR]: ''
    };
    return badges[tier];
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Empire Leaderboard
          </h1>
          
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
              className="px-6 py-3 bg-gradient-to-r from-gem-gold to-gem-crystal text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gem-purple mt-0.5" />
              <div className="text-gray-300 text-sm space-y-1">
                <p className="font-semibold text-white">How Empire Ranking Works:</p>
                <p>• The Empire leaderboard ranks holders based on their $BB tokens and boost multipliers</p>
                <p>• Higher positions unlock more features and exclusive content in the BizarreBeasts miniapp</p>
                <p>• Connect your wallet to see your rank and unlock features based on your Empire position</p>
                <p>• Boost multipliers come from holding other tokens, NFTs, and participating in the ecosystem</p>
              </div>
            </div>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="bg-gradient-to-r from-gem-gold/20 to-gem-crystal/20 border border-gem-gold/40 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2">Search Result:</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getTierColor(searchResult.rank)}`}>
                    #{searchResult.rank}
                  </span>
                  <div>
                    <p className="text-white font-medium">
                      {searchResult.farcasterUsername ? `@${searchResult.farcasterUsername}` : empireService.formatAddress(searchResult.address)}
                    </p>
                    {searchResult.farcasterUsername && (
                      <p className="text-gray-400 text-sm">{empireService.formatAddress(searchResult.address)}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{empireService.formatScore(searchResult.balance)}</p>
                  <p className="text-gray-400 text-sm">{searchResult.finalMultiplier.toFixed(1)}x boost</p>
                </div>
              </div>
            </div>
          )}
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
                  <p className="text-white font-medium truncate">
                    {holder.farcasterUsername ? `@${holder.farcasterUsername}` : empireService.formatAddress(holder.address)}
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-gem-crystal/20">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Rank</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Address/Name</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Score</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Boosters</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Tier</th>
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
                  leaderboard.slice(0, 100).map((holder) => (
                    <tr key={holder.address} className="border-b border-gray-800 hover:bg-dark-card/50 transition">
                      <td className="px-4 py-3">
                        <span className={`font-bold ${getTierColor(holder.rank)}`}>
                          {getTierBadge(holder.rank)} {holder.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">
                            {holder.farcasterUsername ? (
                              <span className="text-gem-crystal">@{holder.farcasterUsername}</span>
                            ) : (
                              empireService.formatAddress(holder.address)
                            )}
                          </p>
                          {holder.farcasterUsername && (
                            <p className="text-gray-500 text-xs">{empireService.formatAddress(holder.address)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-white font-semibold">{empireService.formatScore(holder.balance)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-gray-300">{holder.finalMultiplier.toFixed(1)}x</p>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs font-semibold uppercase ${getTierColor(holder.rank)}`}>
                          {empireService.getUserTier(holder.rank)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && leaderboard.length > 100 && (
            <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-800">
              Showing top 100 holders • Total: {leaderboard.length} holders
            </div>
          )}
        </div>

        {/* Tier Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.values(AccessTier).map((tier) => (
            <div key={tier} className="bg-dark-card border border-gem-purple/20 rounded-lg p-4">
              <h4 className={`font-semibold mb-2 capitalize ${
                tier === AccessTier.ELITE ? 'text-gem-gold' :
                tier === AccessTier.CHAMPION ? 'text-gem-purple' :
                tier === AccessTier.VETERAN ? 'text-gem-blue' :
                tier === AccessTier.MEMBER ? 'text-gem-crystal' :
                'text-gray-400'
              }`}>
                {tier} Tier
              </h4>
              <p className="text-gray-400 text-xs mb-2">
                {tier === AccessTier.ELITE ? 'Rank 1-10' :
                 tier === AccessTier.CHAMPION ? 'Rank 11-50' :
                 tier === AccessTier.VETERAN ? 'Rank 51-100' :
                 tier === AccessTier.MEMBER ? 'Rank 101-500' :
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