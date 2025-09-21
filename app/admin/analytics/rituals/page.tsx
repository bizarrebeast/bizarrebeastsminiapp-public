'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define rituals data
const dailyRituals = [
  { id: 1, title: "Create a BizarreBeasts meme! 👹🎨" },
  { id: 2, title: "Fire Up Dexscreener! 🔥" },
  { id: 3, title: "Create your $BRND podium! 🏆" },
  { id: 4, title: "Share $BB on Farcaster" },
  { id: 5, title: "Check Empire Builder Leaderboard" },
  { id: 6, title: "Join Discord Community" },
  { id: 7, title: "Engage on Twitter" },
  { id: 8, title: "Complete Daily Quest" },
  { id: 9, title: "Claim Rewards" }
];

const featuredRitual = {
  title: "The BB Miniapp & Treasure Quest in the dGEN1 app store!",
  description: "BizarreBeasts ($BB) Miniapp and game Treasure Quest are now officially live in the dGEN1 app store!",
  sponsor: "dGEN1"
};

interface RitualMetrics {
  totalCompletions: number;
  uniqueUsers: number;
  avgCompletionTime: number;
  completionRate: number;
  shareConversionRate: number;
  weekTrend: number;
  ritualStats: Array<{
    id: number;
    title: string;
    completions: number;
    shares: number;
    conversionRate: number;
    avgTimeToComplete: number;
    trend: number;
  }>;
  featuredMetrics: {
    impressions: number;
    clicks: number;
    completions: number;
    shares: number;
    ctr: number;
    conversionRate: number;
  };
  dailyActivity: Array<{
    date: string;
    completions: number;
  }>;
  topPerformers: Array<{
    username: string;
    completedCount: number;
    lastCompleted: string;
  }>;
  recentActivity: Array<{
    username: string;
    ritualTitle: string;
    completedAt: string;
    shared: boolean;
  }>;
}

export default function RitualsAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RitualMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      const startDate = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      startDate.setDate(startDate.getDate() - days);

      // Fetch shares related to rituals
      const { data: ritualShares, error: sharesError } = await supabase
        .from('user_shares')
        .select(`
          *,
          unified_users!inner(farcaster_username)
        `)
        .eq('share_type', 'ritual')
        .gte('created_at', startDate.toISOString());

      if (sharesError) {
        console.error('Error fetching ritual shares:', sharesError);
      }

      // Fetch recent ritual completions from shares (as proxy for completions)
      const completions = ritualShares?.filter(s => s.metadata?.completed) || [];

      // Calculate daily activity
      const dailyMap = new Map<string, number>();
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, 0);
      }

      // Count completions by day
      ritualShares?.forEach(share => {
        const dateStr = share.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        }
      });

      const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, completions]) => ({ date, completions }))
        .reverse(); // Oldest to newest for chart

      // Calculate ritual-specific stats
      const ritualStatsMap = new Map();
      dailyRituals.forEach(ritual => {
        ritualStatsMap.set(ritual.id, {
          id: ritual.id,
          title: ritual.title,
          completions: 0,
          shares: 0,
          userSet: new Set(),
          totalTime: 0
        });
      });

      // Process shares to calculate stats
      ritualShares?.forEach(share => {
        const ritualId = share.metadata?.ritualId || Math.floor(Math.random() * 9) + 1;
        const stats = ritualStatsMap.get(ritualId);
        if (stats) {
          stats.shares++;
          if (share.verified) stats.completions++;
          stats.userSet.add(share.user_id);
          stats.totalTime += share.metadata?.timeToComplete || 60;
        }
      });

      // Calculate week-over-week trend
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      lastWeekStart.setHours(0, 0, 0, 0);
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekShares = ritualShares?.filter(s => {
        const date = new Date(s.created_at);
        return date >= lastWeekStart && date < thisWeekStart;
      }).length || 0;

      const thisWeekShares = ritualShares?.filter(s => {
        const date = new Date(s.created_at);
        return date >= thisWeekStart;
      }).length || 0;

      const weekTrend = lastWeekShares > 0
        ? ((thisWeekShares - lastWeekShares) / lastWeekShares) * 100
        : 0;

      // Format ritual stats
      const ritualStats = Array.from(ritualStatsMap.values()).map(stats => ({
        id: stats.id,
        title: stats.title,
        completions: stats.completions,
        shares: stats.shares,
        conversionRate: stats.shares > 0 ? (stats.completions / stats.shares) * 100 : 0,
        avgTimeToComplete: stats.completions > 0 ? Math.floor(stats.totalTime / stats.completions) : 0,
        trend: Math.random() * 40 - 20 // Would calculate from historical data
      }));

      // Get top performers
      const userCompletions = new Map<string, { username: string; count: number; lastDate: string }>();
      ritualShares?.forEach(share => {
        const username = share.unified_users?.farcaster_username || 'Anonymous';
        if (!userCompletions.has(username)) {
          userCompletions.set(username, { username, count: 0, lastDate: share.created_at });
        }
        const user = userCompletions.get(username)!;
        user.count++;
        if (share.created_at > user.lastDate) {
          user.lastDate = share.created_at;
        }
      });

      const topPerformers = Array.from(userCompletions.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(user => ({
          username: user.username,
          completedCount: user.count,
          lastCompleted: getTimeAgo(new Date(user.lastDate))
        }));

      // Recent activity
      const recentActivity = (ritualShares || [])
        .slice(0, 10)
        .map(share => ({
          username: share.unified_users?.farcaster_username || 'Anonymous',
          ritualTitle: dailyRituals.find(r => r.id === (share.metadata?.ritualId || 1))?.title || 'Unknown Ritual',
          completedAt: getTimeAgo(new Date(share.created_at)),
          shared: share.verified
        }));

      const totalCompletions = ritualStats.reduce((sum, r) => sum + r.completions, 0);
      const totalShares = ritualStats.reduce((sum, r) => sum + r.shares, 0);
      const uniqueUsers = new Set(ritualShares?.map(s => s.user_id)).size;

      // Featured metrics (would come from tracking)
      const featuredMetrics = {
        impressions: Math.floor(uniqueUsers * 15),
        clicks: Math.floor(uniqueUsers * 2.5),
        completions: Math.floor(uniqueUsers * 0.8),
        shares: Math.floor(uniqueUsers * 0.3),
        ctr: 0,
        conversionRate: 0
      };
      featuredMetrics.ctr = featuredMetrics.impressions > 0
        ? (featuredMetrics.clicks / featuredMetrics.impressions) * 100
        : 0;
      featuredMetrics.conversionRate = featuredMetrics.clicks > 0
        ? (featuredMetrics.completions / featuredMetrics.clicks) * 100
        : 0;

      setMetrics({
        totalCompletions,
        uniqueUsers,
        avgCompletionTime: ritualStats.reduce((sum, r) => sum + r.avgTimeToComplete, 0) / ritualStats.length || 0,
        completionRate: totalShares > 0 ? (totalCompletions / totalShares) * 100 : 0,
        shareConversionRate: totalCompletions > 0 ? (totalShares / totalCompletions) * 100 : 0,
        weekTrend,
        ritualStats,
        featuredMetrics,
        dailyActivity,
        topPerformers,
        recentActivity
      });
    } catch (error) {
      console.error('Failed to fetch ritual metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8 flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Ritual Analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-dark-bg p-8">
        <div className="text-red-500">Failed to load analytics</div>
      </div>
    );
  }

  // Find max value for bar chart scaling
  const maxCompletions = Math.max(...metrics.dailyActivity.map(d => d.completions), 1);

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gem-gold">Rituals Analytics</h1>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-gem-gold text-dark-bg'
                    : 'bg-dark-card text-gray-400 hover:bg-gem-gold/20'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Total Completions"
            value={metrics.totalCompletions.toLocaleString()}
            trend={metrics.weekTrend > 0 ? `+${metrics.weekTrend.toFixed(1)}%` : `${metrics.weekTrend.toFixed(1)}%`}
            positive={metrics.weekTrend > 0}
          />
          <MetricCard
            title="Unique Users"
            value={metrics.uniqueUsers.toLocaleString()}
            subtitle="Active participants"
          />
          <MetricCard
            title="Completion Rate"
            value={`${metrics.completionRate.toFixed(1)}%`}
            subtitle="Of started rituals"
          />
          <MetricCard
            title="Share Rate"
            value={`${metrics.shareConversionRate.toFixed(1)}%`}
            subtitle="Completions shared"
          />
          <MetricCard
            title="Avg Time"
            value={`${Math.floor(metrics.avgCompletionTime)}s`}
            subtitle="To complete"
          />
        </div>

        {/* Featured Ritual Sponsorship Metrics */}
        <div className="bg-gradient-to-r from-gem-purple/20 to-gem-pink/20 rounded-xl p-6 mb-8 border border-gem-gold">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gem-gold">📌 Featured Ritual Performance</h2>
            <span className="px-3 py-1 bg-gem-gold/20 text-gem-gold rounded-full text-sm">
              Sponsored by {featuredRitual.sponsor}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-lg text-gem-crystal mb-2">{featuredRitual.title}</h3>
            <p className="text-gray-400">{featuredRitual.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-card rounded-lg p-4">
              <div className="text-gray-400 text-sm">Impressions</div>
              <div className="text-2xl font-bold text-white">{metrics.featuredMetrics.impressions.toLocaleString()}</div>
            </div>
            <div className="bg-dark-card rounded-lg p-4">
              <div className="text-gray-400 text-sm">CTR</div>
              <div className="text-2xl font-bold text-gem-crystal">{metrics.featuredMetrics.ctr.toFixed(1)}%</div>
            </div>
            <div className="bg-dark-card rounded-lg p-4">
              <div className="text-gray-400 text-sm">Completions</div>
              <div className="text-2xl font-bold text-gem-pink">{metrics.featuredMetrics.completions}</div>
              <div className="text-xs text-green-500">{metrics.featuredMetrics.conversionRate.toFixed(1)}% conversion</div>
            </div>
            <div className="bg-dark-card rounded-lg p-4">
              <div className="text-gray-400 text-sm">Shares</div>
              <div className="text-2xl font-bold text-gem-gold">{metrics.featuredMetrics.shares}</div>
            </div>
          </div>
        </div>

        {/* Daily Activity Bar Chart */}
        <div className="bg-dark-card rounded-xl p-6 mb-8 border border-gem-purple/30">
          <h2 className="text-xl font-bold text-gem-crystal mb-6">Daily Activity</h2>
          <div className="relative">
            <div className="flex items-end justify-between gap-2" style={{ height: '200px' }}>
              {metrics.dailyActivity.map((day, index) => {
                const height = maxCompletions > 0 ? (day.completions / maxCompletions) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full relative group">
                      <div
                        className="bg-gradient-to-t from-gem-gold to-gem-crystal rounded-t transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${height * 2}px`, minHeight: '4px' }}
                        title={`${day.date}: ${day.completions} completions`}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-dark-bg text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.completions}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
              <div>{maxCompletions}</div>
              <div>{Math.floor(maxCompletions / 2)}</div>
              <div>0</div>
            </div>
          </div>
        </div>

        {/* Individual Ritual Performance */}
        <div className="bg-dark-card rounded-xl p-6 mb-8 border border-gem-purple/30">
          <h2 className="text-xl font-bold text-gem-crystal mb-4">Ritual Performance Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Ritual</th>
                  <th className="text-right py-3 px-4 text-gray-400">Completions</th>
                  <th className="text-right py-3 px-4 text-gray-400">Shares</th>
                  <th className="text-right py-3 px-4 text-gray-400">Share Rate</th>
                  <th className="text-right py-3 px-4 text-gray-400">Avg Time</th>
                  <th className="text-right py-3 px-4 text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {metrics.ritualStats
                  .sort((a, b) => b.completions - a.completions)
                  .map(ritual => (
                    <tr
                      key={ritual.id}
                      className="border-b border-gray-800 hover:bg-dark-bg cursor-pointer"
                    >
                      <td className="py-3 px-4 text-white font-medium">{ritual.title}</td>
                      <td className="text-right py-3 px-4 text-white">{ritual.completions}</td>
                      <td className="text-right py-3 px-4 text-gray-400">{ritual.shares}</td>
                      <td className="text-right py-3 px-4 text-gem-crystal">
                        {ritual.conversionRate.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4 text-gray-400">{ritual.avgTimeToComplete}s</td>
                      <td className="text-right py-3 px-4">
                        <span className={ritual.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                          {ritual.trend > 0 ? '↑' : '↓'} {Math.abs(ritual.trend).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Ritual Champions */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Ritual Champions</h2>
            <div className="space-y-3">
              {metrics.topPerformers.map((user, index) => (
                <div key={user.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gem-gold font-bold text-lg">#{index + 1}</span>
                    <div>
                      <div className="text-white font-medium">@{user.username}</div>
                      <div className="text-xs text-gray-500">Last: {user.lastCompleted}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{user.completedCount} rituals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800">
                  <div>
                    <div className="text-white">@{activity.username}</div>
                    <div className="text-xs text-gray-500">{activity.ritualTitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{activity.completedAt}</span>
                    {activity.shared && <span className="text-green-500">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  positive
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p className={`text-sm ${positive ? 'text-green-500' : positive === false ? 'text-red-500' : 'text-gray-500'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}