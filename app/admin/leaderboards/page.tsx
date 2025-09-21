'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LeaderboardEntry {
  rank: number;
  username: string;
  walletAddress?: string;
  score: number;
  tier?: string;
  trend?: 'up' | 'down' | 'same';
  details?: string;
}

interface LeaderboardData {
  shares: LeaderboardEntry[];
  rituals: LeaderboardEntry[];
  contests: LeaderboardEntry[];
  checkIns: LeaderboardEntry[];
  empire: LeaderboardEntry[];
  viral: LeaderboardEntry[];
}

const LEADERBOARD_CATEGORIES = [
  { id: 'shares', title: 'Top Sharers', icon: '🔄', color: 'gem-gold' },
  { id: 'rituals', title: 'Ritual Champions', icon: '🎯', color: 'gem-crystal' },
  { id: 'contests', title: 'Contest Winners', icon: '🏆', color: 'gem-pink' },
  { id: 'checkIns', title: 'Check-in Streaks', icon: '✅', color: 'gem-purple' },
  { id: 'empire', title: 'Empire Climbers', icon: '👑', color: 'gem-gold' },
  { id: 'viral', title: 'Viral Influencers', icon: '🚀', color: 'gem-crystal' }
];

export default function LeaderboardsHub() {
  const [leaderboards, setLeaderboards] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('shares');
  const [timeRange, setTimeRange] = useState('7d');
  const [exportReady, setExportReady] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
    const interval = setInterval(fetchLeaderboards, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchLeaderboards = async () => {
    try {
      // Calculate date range
      const startDate = new Date();
      const endDate = new Date();
      if (timeRange === '24h') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (timeRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeRange === 'all') {
        startDate.setFullYear(2024, 0, 1); // Set to start of 2024
      }

      // Fetch share leaderboard from user_shares
      const { data: shareUsers } = await supabase
        .from('user_shares')
        .select(`
          user_id,
          unified_users!inner(farcaster_username)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Aggregate share counts per user
      const shareCountMap = new Map<string, { username: string; count: number; points: number }>();
      shareUsers?.forEach((share: any) => {
        const username = share.unified_users?.farcaster_username || 'Anonymous';
        const existing = shareCountMap.get(share.user_id) || { username, count: 0, points: 0 };
        existing.count++;
        existing.points += 10; // Each share worth 10 points
        shareCountMap.set(share.user_id, existing);
      });

      const shares: LeaderboardEntry[] = Array.from(shareCountMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          score: user.count,
          trend: index < 5 ? 'up' : index > 15 ? 'down' : 'same',
          details: `${user.points} points earned`
        }));

      // Fetch ritual leaderboard from ritual shares
      const { data: ritualUsers } = await supabase
        .from('user_shares')
        .select(`
          user_id,
          unified_users!inner(farcaster_username),
          created_at
        `)
        .eq('share_type', 'ritual')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculate ritual streaks
      const ritualStreakMap = new Map<string, any>();
      ritualUsers?.forEach((ritual: any) => {
        const username = ritual.unified_users?.farcaster_username || 'Anonymous';
        const existing = ritualStreakMap.get(ritual.user_id) || { username, streak: 0, completions: 0, dates: new Set() };
        existing.completions++;
        // Simple streak calculation - count unique days
        const dateStr = ritual.created_at.split('T')[0];
        existing.dates.add(dateStr);
        existing.streak = existing.dates.size;
        ritualStreakMap.set(ritual.user_id, existing);
      });

      const rituals: LeaderboardEntry[] = Array.from(ritualStreakMap.values())
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          score: user.completions,
          trend: index < 5 ? 'up' : 'same',
          details: `${user.streak} day streak`
        }));

      // Fetch contest leaderboard from contest_winners and submissions
      const { data: contestWinners } = await supabase
        .from('contest_winners')
        .select(`
          wallet_address,
          position,
          prize_amount,
          contest_id
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: contestSubmissions } = await supabase
        .from('contest_submissions')
        .select(`
          wallet_address,
          username,
          score
        `)
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString());

      // Aggregate contest performance
      const contestMap = new Map<string, { username: string; totalScore: number; wins: number; top10s: number }>();

      // Process submissions for scores
      contestSubmissions?.forEach((submission: any) => {
        const key = submission.wallet_address;
        const existing = contestMap.get(key) || {
          username: submission.username || 'Anonymous',
          totalScore: 0,
          wins: 0,
          top10s: 0
        };
        existing.totalScore += submission.score || 0;
        contestMap.set(key, existing);
      });

      // Process winners for wins and top 10s
      contestWinners?.forEach((winner: any) => {
        const existing = contestMap.get(winner.wallet_address) || {
          username: 'Anonymous',
          totalScore: 0,
          wins: 0,
          top10s: 0
        };
        if (winner.position === 1) existing.wins++;
        if (winner.position <= 10) existing.top10s++;
        existing.totalScore += winner.prize_amount || 0;
        contestMap.set(winner.wallet_address, existing);
      });

      const contests: LeaderboardEntry[] = Array.from(contestMap.values())
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          score: user.totalScore,
          trend: user.wins > 0 ? 'up' : 'same',
          details: user.wins > 0 ? `${user.wins} wins` : `${user.top10s} top-10s`
        }));

      // Fetch check-in data (users who completed 3+ rituals get check-in access)
      // We'll use ritual completion counts as proxy for check-in streaks
      const checkInMap = new Map<string, any>();

      // Group ritual completions by date to calculate streaks
      ritualUsers?.forEach((ritual: any) => {
        const username = ritual.unified_users?.farcaster_username || 'Anonymous';
        const userId = ritual.user_id;
        const existing = checkInMap.get(userId) || { username, streak: 0, tier: 'NORMIE', dates: new Set() };

        const dateStr = ritual.created_at.split('T')[0];
        existing.dates.add(dateStr);
        existing.streak = existing.dates.size;

        // Calculate tier based on streak
        if (existing.streak >= 30) existing.tier = 'BIZARRE';
        else if (existing.streak >= 20) existing.tier = 'WEIRDO';
        else if (existing.streak >= 10) existing.tier = 'ODDBALL';
        else if (existing.streak >= 5) existing.tier = 'MISFIT';
        else existing.tier = 'NORMIE';

        checkInMap.set(userId, existing);
      });

      const checkIns: LeaderboardEntry[] = Array.from(checkInMap.values())
        .filter(user => user.streak >= 3) // Only users with 3+ day streaks
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          score: user.streak,
          trend: user.streak > 10 ? 'up' : 'same',
          details: `${user.tier} tier`,
          tier: user.tier
        }));

      // Fetch empire data from unified_users (cached Empire protocol data)
      const { data: empireUsers } = await supabase
        .from('unified_users')
        .select('farcaster_username, empire_score, empire_tier, empire_rank')
        .not('empire_score', 'is', null)
        .order('empire_rank', { ascending: true })
        .limit(20);

      const empire: LeaderboardEntry[] = (empireUsers || []).map((user, index) => ({
        rank: user.empire_rank || index + 1,
        username: user.farcaster_username || 'Anonymous',
        score: parseInt(user.empire_score || '0'),
        trend: index < 5 ? 'up' : index > 15 ? 'down' : 'same',
        details: `${user.empire_tier || 'NORMIE'} tier`,
        tier: user.empire_tier || 'NORMIE'
      }));

      // Calculate viral influence from shares that were verified
      const { data: viralData } = await supabase
        .from('user_shares')
        .select(`
          user_id,
          unified_users!inner(farcaster_username),
          verified
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculate viral coefficient (verified shares / total shares)
      const viralMap = new Map<string, { username: string; totalShares: number; verifiedShares: number; coefficient: number }>();
      viralData?.forEach((share: any) => {
        const username = share.unified_users?.farcaster_username || 'Anonymous';
        const existing = viralMap.get(share.user_id) || {
          username,
          totalShares: 0,
          verifiedShares: 0,
          coefficient: 0
        };
        existing.totalShares++;
        if (share.verified) existing.verifiedShares++;
        existing.coefficient = existing.totalShares > 0 ?
          (existing.verifiedShares / existing.totalShares * 2.5) : 0; // Max 2.5x coefficient
        viralMap.set(share.user_id, existing);
      });

      const viral: LeaderboardEntry[] = Array.from(viralMap.values())
        .filter(user => user.totalShares >= 5) // Min 5 shares to qualify
        .sort((a, b) => b.verifiedShares - a.verifiedShares)
        .slice(0, 20)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          score: user.verifiedShares,
          trend: user.coefficient > 1.5 ? 'up' : 'same',
          details: `${user.coefficient.toFixed(1)}x viral coefficient`
        }));

      setLeaderboards({
        shares,
        rituals,
        contests,
        checkIns,
        empire,
        viral
      });

      setExportReady(true);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!leaderboards) return;

    const currentLeaderboard = leaderboards[selectedCategory as keyof LeaderboardData];
    const csv = [
      ['Rank', 'Username', 'Score', 'Details'].join(','),
      ...currentLeaderboard.map(entry =>
        [entry.rank, entry.username, entry.score, entry.details || ''].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCategory}-leaderboard-${timeRange}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8 flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Leaderboards...</div>
      </div>
    );
  }

  if (!leaderboards) {
    return (
      <div className="min-h-screen bg-dark-bg p-8">
        <div className="text-red-500">Failed to load leaderboards</div>
      </div>
    );
  }

  const currentLeaderboard = leaderboards[selectedCategory as keyof LeaderboardData];

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gem-gold">🏅 Leaderboards Hub</h1>
          <div className="flex gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {['24h', '7d', '30d', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    timeRange === range
                      ? 'bg-gem-gold text-dark-bg'
                      : 'bg-dark-card text-gray-400 hover:bg-gem-gold/20'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={!exportReady}
              className="px-4 py-2 bg-gem-purple text-white rounded-lg hover:bg-gem-purple/80 disabled:opacity-50"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {LEADERBOARD_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl transition-all ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r from-${category.color}/30 to-${category.color}/10 border-2 border-${category.color}`
                  : 'bg-dark-card border border-gray-700 hover:border-gem-purple/50'
              }`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-white">{category.title}</div>
            </button>
          ))}
        </div>

        {/* Main Leaderboard Display */}
        <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gem-crystal">
              {LEADERBOARD_CATEGORIES.find(c => c.id === selectedCategory)?.icon}{' '}
              {LEADERBOARD_CATEGORIES.find(c => c.id === selectedCategory)?.title}
            </h2>
            <div className="text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-2">
            {currentLeaderboard.map((entry, index) => (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-4 rounded-lg transition-all hover:bg-gem-purple/10 ${
                  index === 0 ? 'bg-gradient-to-r from-gem-gold/20 to-transparent border border-gem-gold/30' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-500/30' :
                  index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-transparent border border-orange-600/30' :
                  'bg-dark-bg'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="min-w-[60px] text-center">
                    {index === 0 ? (
                      <span className="text-3xl">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-3xl">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-3xl">🥉</span>
                    ) : (
                      <span className="text-2xl font-bold text-gray-500">#{entry.rank}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">@{entry.username}</span>
                      {entry.tier && (
                        <span className={`px-2 py-1 text-xs rounded-full bg-gem-purple/20 text-gem-crystal`}>
                          {entry.tier}
                        </span>
                      )}
                    </div>
                    {entry.details && (
                      <div className="text-sm text-gray-500">{entry.details}</div>
                    )}
                  </div>
                </div>

                {/* Score and Trend */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gem-gold">{entry.score.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {selectedCategory === 'shares' ? 'shares' :
                       selectedCategory === 'rituals' ? 'completed' :
                       selectedCategory === 'contests' ? 'points' :
                       selectedCategory === 'checkIns' ? 'day streak' :
                       selectedCategory === 'empire' ? 'empire pts' :
                       'referrals'}
                    </div>
                  </div>
                  {entry.trend && (
                    <div className="text-2xl">
                      {entry.trend === 'up' ? '📈' : entry.trend === 'down' ? '📉' : '➡️'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-6 text-center">
            <button className="px-6 py-2 bg-gem-purple/20 text-gem-crystal rounded-lg hover:bg-gem-purple/30 transition-colors">
              Load More Rankings
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h3 className="text-lg font-bold text-gem-crystal mb-4">📊 Category Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Participants</span>
                <span className="text-white font-medium">{currentLeaderboard.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Score</span>
                <span className="text-white font-medium">
                  {Math.round(currentLeaderboard.reduce((sum, e) => sum + e.score, 0) / currentLeaderboard.length)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Top Score</span>
                <span className="text-gem-gold font-medium">{currentLeaderboard[0]?.score || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h3 className="text-lg font-bold text-gem-crystal mb-4">🏆 Achievements</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span className="text-gray-400">Perfect Week: 5 users</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <span className="text-gray-400">On Fire: 12 users</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⭐</span>
                <span className="text-gray-400">Rising Star: 8 users</span>
              </div>
            </div>
          </div>

          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h3 className="text-lg font-bold text-gem-crystal mb-4">📈 Trends</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">New Entries</span>
                <span className="text-green-500">+18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Activity Level</span>
                <span className="text-green-500">+24%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Competition Index</span>
                <span className="text-gem-gold">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}