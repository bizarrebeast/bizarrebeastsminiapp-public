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
  title: "Notorious B.I.Z. is Back! Battle for 25M $BB on Farverse!",
  description: "The legend returns! Battle for 25 MILLION $BB tokens in the ultimate Slay-to-Earn arena!",
  sponsor: "Farverse"
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
      // Fetch ritual analytics from our API endpoint
      const response = await fetch(`/api/rituals/track?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ritual metrics');
      }
      const apiData = await response.json();

      // Fetch completions directly from Supabase for detailed data
      const startDate = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      startDate.setDate(startDate.getDate() - days);

      const { data: completions, error: completionsError } = await supabase
        .from('ritual_completions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
      }

      // Fetch clicks for featured ritual
      const { data: clicks, error: clicksError } = await supabase
        .from('ritual_clicks')
        .select('*')
        .eq('ritual_id', 0) // Featured ritual
        .gte('created_at', startDate.toISOString());

      if (clicksError) {
        console.error('Error fetching clicks:', clicksError);
      }

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
      completions?.forEach(completion => {
        const dateStr = completion.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        }
      });

      const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, completions]) => ({ date, completions }))
        .reverse(); // Oldest to newest for chart

      // Use API data for ritual stats
      const ritualStats = apiData.ritualStats || [];

      // Enhance ritual stats with titles
      const enhancedRitualStats = ritualStats.map((stat: any) => {
        const ritual = dailyRituals.find(r => r.id === stat.id);
        return {
          ...stat,
          title: ritual?.title || stat.title || `Ritual ${stat.id}`,
          shares: stat.completions, // For now, shares = completions
          conversionRate: 100, // 100% since we only track completions
          trend: Math.random() * 40 - 20 // Placeholder trend
        };
      });

      // Calculate week-over-week trend
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      lastWeekStart.setHours(0, 0, 0, 0);
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekCompletions = completions?.filter(c => {
        const date = new Date(c.created_at);
        return date >= lastWeekStart && date < thisWeekStart;
      }).length || 0;

      const thisWeekCompletions = completions?.filter(c => {
        const date = new Date(c.created_at);
        return date >= thisWeekStart;
      }).length || 0;

      const weekTrend = lastWeekCompletions > 0
        ? ((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100
        : 0;

      // Format top performers
      const topPerformers = apiData.topPerformers?.map((user: any) => ({
        username: user.username || 'Anonymous',
        completedCount: user.completedCount,
        lastCompleted: getTimeAgo(new Date(user.lastCompleted))
      })) || [];

      // Recent activity from completions
      const recentActivity = (completions || [])
        .slice(0, 10)
        .map(completion => {
          const ritual = dailyRituals.find(r => r.id === completion.ritual_id);
          return {
            username: completion.wallet_address?.slice(0, 6) + '...' || 'Anonymous',
            ritualTitle: ritual?.title || completion.ritual_title || `Ritual ${completion.ritual_id}`,
            completedAt: getTimeAgo(new Date(completion.created_at)),
            shared: completion.completed
          };
        });

      const totalCompletions = apiData.totalCompletions || 0;
      const uniqueUsers = apiData.uniqueUsers || 0;
      const totalShares = totalCompletions; // For now, assume all completions are shared

      // Featured metrics from clicks data
      const featuredClicks = clicks?.length || 0;
      const featuredCompletions = completions?.filter(c => c.ritual_id === 0).length || 0;
      const featuredMetrics = {
        impressions: Math.max(featuredClicks * 5, uniqueUsers * 3), // Estimate impressions
        clicks: featuredClicks,
        completions: featuredCompletions,
        shares: Math.floor(featuredCompletions * 0.5), // Estimate shares
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
        avgCompletionTime: enhancedRitualStats.reduce((sum: number, r: any) => sum + (r.avgTimeToComplete || 0), 0) / Math.max(enhancedRitualStats.length, 1) || 0,
        completionRate: 100, // Since we only track completions
        shareConversionRate: totalCompletions > 0 ? (totalShares / totalCompletions) * 100 : 100,
        weekTrend,
        ritualStats: enhancedRitualStats,
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

  const abbreviateAddress = (address: string) => {
    if (!address || !address.startsWith('0x')) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                      <div className="text-white font-medium">@{abbreviateAddress(user.username)}</div>
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
                    <div className="text-white">@{abbreviateAddress(activity.username)}</div>
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