'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ShareMetrics {
  totalShares: number;
  verifiedShares: number;
  shareToCheckinRate: number;
  avgQualityScore: number;
  viralCoefficient: number;
  platformStats: Record<string, number>;
  shareTypeStats: Record<string, number>;
  topSharers: Array<{
    username: string;
    shareCount: number;
    points: number;
  }>;
  recentShares: Array<{
    id: string;
    username: string;
    platform: string;
    type: string;
    verified: boolean;
    createdAt: string;
  }>;
  dailyActivity: Array<{
    date: string;
    shares: number;
  }>;
  trends: {
    totalSharesTrend: number;
    verifiedSharesTrend: number;
    conversionTrend: number;
  };
}

export default function ShareAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<ShareMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      // Get time filter
      const startDate = new Date();
      let days = 7;
      if (timeRange === '24h') {
        startDate.setHours(startDate.getHours() - 24);
        days = 1;
      } else if (timeRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
        days = 7;
      } else if (timeRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
        days = 30;
      }

      // Calculate previous period for trend comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      // Fetch total shares
      const { count: totalShares } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Fetch verified shares
      const { count: verifiedShares } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)
        .gte('created_at', startDate.toISOString());

      // Fetch platform distribution
      const { data: platformData } = await supabase
        .from('user_shares')
        .select('share_platform')
        .gte('created_at', startDate.toISOString());

      const platformStats: Record<string, number> = {};
      platformData?.forEach(share => {
        platformStats[share.share_platform] = (platformStats[share.share_platform] || 0) + 1;
      });

      // Fetch share type distribution
      const { data: typeData } = await supabase
        .from('user_shares')
        .select('share_type')
        .gte('created_at', startDate.toISOString());

      const shareTypeStats: Record<string, number> = {};
      typeData?.forEach(share => {
        shareTypeStats[share.share_type] = (shareTypeStats[share.share_type] || 0) + 1;
      });

      // Fetch top sharers
      const { data: topSharersData } = await supabase
        .from('share_analytics')
        .select('farcaster_username, total_shares, total_points')
        .order('total_shares', { ascending: false })
        .limit(10);

      const topSharers = topSharersData?.map(user => ({
        username: user.farcaster_username || 'Anonymous',
        shareCount: user.total_shares || 0,
        points: user.total_points || 0
      })) || [];

      // Fetch recent shares
      const { data: recentSharesData } = await supabase
        .from('user_shares')
        .select(`
          id,
          share_platform,
          share_type,
          verified,
          created_at,
          user_id,
          unified_users!inner(farcaster_username)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      const recentShares = recentSharesData?.map((share: any) => ({
        id: share.id,
        username: share.unified_users?.farcaster_username || 'Anonymous',
        platform: share.share_platform,
        type: share.share_type,
        verified: share.verified,
        createdAt: share.created_at
      })) || [];

      // Calculate share to check-in rate
      const { count: checkInUnlocks } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .eq('unlocked_checkin', true)
        .gte('created_at', startDate.toISOString());

      const shareToCheckinRate = totalShares ? (checkInUnlocks || 0) / totalShares * 100 : 0;

      // Calculate viral coefficient (simplified)
      const uniqueSharers = new Set(recentSharesData?.map(s => s.user_id)).size;
      const viralCoefficient = uniqueSharers > 0 ? totalShares! / uniqueSharers : 0;

      // Fetch previous period data for trends
      const { count: prevTotalShares } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const { count: prevVerifiedShares } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const { count: prevCheckInUnlocks } = await supabase
        .from('user_shares')
        .select('*', { count: 'exact', head: true })
        .eq('unlocked_checkin', true)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calculate trends
      const totalSharesTrend = prevTotalShares ? ((totalShares! - prevTotalShares) / prevTotalShares) * 100 : 0;
      const verifiedSharesTrend = prevVerifiedShares ? ((verifiedShares! - prevVerifiedShares) / prevVerifiedShares) * 100 : 0;
      const prevConversionRate = prevTotalShares ? (prevCheckInUnlocks || 0) / prevTotalShares * 100 : 0;
      const conversionTrend = prevConversionRate ? ((shareToCheckinRate - prevConversionRate) / prevConversionRate) * 100 : 0;

      // Fetch daily activity for bar chart
      const { data: allShares } = await supabase
        .from('user_shares')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Calculate daily activity
      const dailyMap = new Map<string, number>();
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, 0);
      }

      allShares?.forEach(share => {
        const dateStr = share.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, dailyMap.get(dateStr)! + 1);
        }
      });

      const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, shares]) => ({ date, shares }))
        .reverse();

      setMetrics({
        totalShares: totalShares || 0,
        verifiedShares: verifiedShares || 0,
        shareToCheckinRate,
        avgQualityScore: verifiedShares && totalShares ? verifiedShares / totalShares : 0,
        viralCoefficient,
        platformStats,
        shareTypeStats,
        topSharers,
        recentShares,
        dailyActivity,
        trends: {
          totalSharesTrend,
          verifiedSharesTrend,
          conversionTrend
        }
      });
    } catch (error) {
      console.error('Failed to fetch share metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8 flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Analytics...</div>
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

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gem-gold">Share Analytics Dashboard</h1>
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
            title="Total Shares"
            value={metrics.totalShares.toLocaleString()}
            trend={metrics.trends.totalSharesTrend !== 0 ?
              `${metrics.trends.totalSharesTrend > 0 ? '+' : ''}${metrics.trends.totalSharesTrend.toFixed(1)}%` :
              undefined
            }
          />
          <MetricCard
            title="Verified Shares"
            value={metrics.verifiedShares.toLocaleString()}
            subtitle={`${(metrics.avgQualityScore * 100).toFixed(1)}% verified`}
            trend={metrics.trends.verifiedSharesTrend !== 0 ?
              `${metrics.trends.verifiedSharesTrend > 0 ? '+' : ''}${metrics.trends.verifiedSharesTrend.toFixed(1)}%` :
              undefined
            }
          />
          <MetricCard
            title="Share → Check-in"
            value={`${metrics.shareToCheckinRate.toFixed(1)}%`}
            subtitle="Conversion rate"
            trend={metrics.trends.conversionTrend !== 0 ?
              `${metrics.trends.conversionTrend > 0 ? '+' : ''}${metrics.trends.conversionTrend.toFixed(1)}%` :
              undefined
            }
          />
          <MetricCard
            title="Viral Coefficient"
            value={metrics.viralCoefficient.toFixed(2)}
            target="1.2"
          />
          <MetricCard
            title="Avg per User"
            value={(metrics.viralCoefficient).toFixed(1)}
            subtitle="Shares per user"
          />
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30 mb-8">
          <h2 className="text-xl font-bold text-gem-crystal mb-4">Daily Share Activity</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {metrics.dailyActivity.map((day) => {
              const maxShares = Math.max(...metrics.dailyActivity.map(d => d.shares));
              const heightPercent = maxShares > 0 ? (day.shares / maxShares) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-dark-bg rounded-t" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-gem-gold to-gem-crystal rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${heightPercent}%`,
                        marginTop: `${100 - heightPercent}%`
                      }}
                      title={`${day.shares} shares on ${day.date}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 -rotate-45 origin-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gem-gold font-bold">
                    {day.shares}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform & Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Platform Stats */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Platform Distribution</h2>
            <div className="space-y-3">
              {Object.entries(metrics.platformStats).map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-gray-400 capitalize">{platform}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-dark-bg rounded-full h-2">
                      <div
                        className="h-full bg-gem-gold rounded-full"
                        style={{
                          width: `${(count / metrics.totalShares) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white min-w-[60px] text-right">
                      {((count / metrics.totalShares) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Type Stats */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Share Types</h2>
            <div className="space-y-3">
              {Object.entries(metrics.shareTypeStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-400 capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-dark-bg rounded-full h-2">
                        <div
                          className="h-full bg-gem-pink rounded-full"
                          style={{
                            width: `${(count / metrics.totalShares) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-white min-w-[60px] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Sharers & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Sharers */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Top Sharers</h2>
            <div className="space-y-2">
              {metrics.topSharers.map((user, index) => (
                <div key={user.username} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gem-gold font-bold">#{index + 1}</span>
                    <span className="text-white">@{user.username}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">{user.shareCount} shares</span>
                    <span className="text-gem-crystal">{user.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Shares */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Recent Activity</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.recentShares.map(share => (
                <div key={share.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">
                      {new Date(share.createdAt).toLocaleTimeString()}
                    </span>
                    <span className="text-white">@{share.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-gem-purple/20 text-gem-crystal">
                      {share.platform}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gem-gold/20 text-gem-gold">
                      {share.type}
                    </span>
                    {share.verified && (
                      <span className="text-green-500">✓</span>
                    )}
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
  target
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  target?: string;
}) {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p className={`text-sm ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </p>
      )}
      {target && <p className="text-xs text-gray-600">Target: {target}</p>}
    </div>
  );
}