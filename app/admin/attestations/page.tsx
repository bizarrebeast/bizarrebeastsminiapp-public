'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trophy, TrendingUp, Users, Zap, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AttestationMetrics {
  totalAttestations: number;
  uniqueWallets: number;
  totalGasSpent: string;
  avgGasPrice: string;
  todayAttestations: number;
  weekTrend: number;
  hourlyDistribution: Record<number, number>;
  leaderboard: Array<{
    rank: number;
    wallet_address: string;
    username?: string;
    total_attestations: number;
    current_streak: number;
    best_streak: number;
    last_attestation_date: string;
  }>;
  recentAttestations: Array<{
    wallet_address: string;
    username?: string;
    tx_hash: string;
    block_number: number;
    created_at: string;
  }>;
  streakDistribution: {
    active: number;
    broken: number;
    legendary: number; // 30+ days
  };
  networkStats: {
    contractAddress: string;
    deploymentDate: string;
    totalTransactions: number;
    averageCooldown: number;
  };
}

export default function AttestationsAnalytics() {
  const [metrics, setMetrics] = useState<AttestationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [whitelistOnly] = useState(true); // Currently whitelisted

  // Whitelisted wallets
  const WHITELIST = [
    '0x4F2EcDA8C10EC8Fbe711f6664970826998B81c3E',
    '0x300a8611D53ca380dA1c556Ca5F8a64D8e1A9dfB',
    '0x3FDD6aFEd7a19990632468c7102219d051E685dB'
  ];

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

      // Fetch attestation data
      const { data: attestations, error: attestError } = await supabase
        .from('bizarre_attestations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (attestError) {
        console.error('Error fetching attestations:', attestError);
      }

      // Fetch stats
      const { data: stats } = await supabase
        .from('bizarre_attestation_stats')
        .select('*')
        .order('total_attestations', { ascending: false });

      // Fetch leaderboard
      const { data: leaderboard } = await supabase
        .from('bizarre_attestation_leaderboard')
        .select('*')
        .limit(10);

      // Calculate hourly distribution
      const hourlyDistribution: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        hourlyDistribution[i] = 0;
      }

      attestations?.forEach(att => {
        const hour = new Date(att.created_at).getHours();
        hourlyDistribution[hour]++;
      });

      // Calculate today's attestations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAttestations = attestations?.filter(
        att => new Date(att.created_at) >= today
      ).length || 0;

      // Calculate week-over-week trend
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const lastWeek = attestations?.filter(att => {
        const date = new Date(att.created_at);
        return date >= lastWeekStart && date < thisWeekStart;
      }).length || 0;

      const thisWeek = attestations?.filter(att => {
        const date = new Date(att.created_at);
        return date >= thisWeekStart;
      }).length || 0;

      const weekTrend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

      // Calculate streak distribution
      const streakDistribution = {
        active: stats?.filter(s => s.current_streak > 0).length || 0,
        broken: stats?.filter(s => s.current_streak === 0 && s.total_attestations > 0).length || 0,
        legendary: stats?.filter(s => s.best_streak >= 30).length || 0
      };

      // Calculate gas metrics (estimate)
      const avgGasUsed = 150000; // Estimated gas units per attestation
      const avgGasPriceGwei = 0.003; // Gas price in Gwei on Base
      const gweiToEth = 0.000000001; // 1 gwei = 10^-9 ETH
      const totalGasSpent = (attestations?.length || 0) * avgGasUsed * avgGasPriceGwei * gweiToEth;

      setMetrics({
        totalAttestations: attestations?.length || 0,
        uniqueWallets: new Set(attestations?.map(a => a.wallet_address)).size || 0,
        totalGasSpent: totalGasSpent.toFixed(6),
        avgGasPrice: avgGasPriceGwei.toFixed(3),
        todayAttestations,
        weekTrend,
        hourlyDistribution,
        leaderboard: leaderboard || [],
        recentAttestations: attestations?.slice(0, 10).map(att => ({
          wallet_address: att.wallet_address,
          username: att.username,
          tx_hash: att.tx_hash,
          block_number: att.block_number,
          created_at: att.created_at
        })) || [],
        streakDistribution,
        networkStats: {
          contractAddress: '0xdfED9511d9dc546755127E67E50a1B9F4DeA6585',
          deploymentDate: '2025-09-27',
          totalTransactions: attestations?.length || 0,
          averageCooldown: 20 // hours
        }
      });
    } catch (error) {
      console.error('Failed to fetch attestation metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8 flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Attestation Analytics...</div>
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

  // Find max value for hourly chart
  const maxHourly = Math.max(...Object.values(metrics.hourlyDistribution), 1);

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gem-gold mb-2">
              Ritual 10: "Prove It" Analytics
            </h1>
            <p className="text-gray-400">Onchain attestations declaring "I AM BIZARRE"</p>
            {whitelistOnly && (
              <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full inline-block text-sm">
                🔒 Whitelist Mode - {WHITELIST.length} wallets
              </div>
            )}
          </div>
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

        {/* Network Info */}
        <div className="bg-gradient-to-r from-gem-purple/20 to-gem-gold/20 rounded-xl p-6 mb-8 border border-gem-gold/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gem-gold mb-2">Contract Details</h3>
              <p className="text-white font-mono text-sm mb-1">
                {metrics.networkStats.contractAddress}
              </p>
              <p className="text-gray-400 text-sm">
                Deployed on Base Mainnet • {metrics.networkStats.deploymentDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gem-crystal">
                {metrics.networkStats.averageCooldown}h
              </div>
              <div className="text-gray-400 text-sm">Cooldown Period</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Total Attestations"
            value={metrics.totalAttestations.toLocaleString()}
            icon={<CheckCircle className="w-5 h-5" />}
            trend={metrics.weekTrend > 0 ? `+${metrics.weekTrend.toFixed(1)}%` : `${metrics.weekTrend.toFixed(1)}%`}
            positive={metrics.weekTrend > 0}
          />
          <MetricCard
            title="Unique Wallets"
            value={metrics.uniqueWallets.toLocaleString()}
            icon={<Users className="w-5 h-5" />}
            subtitle={`of ${WHITELIST.length} whitelisted`}
          />
          <MetricCard
            title="Today"
            value={metrics.todayAttestations.toLocaleString()}
            icon={<Zap className="w-5 h-5" />}
            subtitle="Attestations"
          />
          <MetricCard
            title="Active Streaks"
            value={metrics.streakDistribution.active.toLocaleString()}
            icon={<TrendingUp className="w-5 h-5" />}
            subtitle="Wallets"
          />
          <MetricCard
            title="Gas Spent"
            value={`${metrics.totalGasSpent} ETH`}
            icon={<AlertCircle className="w-5 h-5" />}
            subtitle="Total on Base"
          />
          <MetricCard
            title="Legendary"
            value={metrics.streakDistribution.legendary.toLocaleString()}
            icon={<Trophy className="w-5 h-5" />}
            subtitle="30+ day streaks"
          />
        </div>

        {/* Hourly Distribution */}
        <div className="bg-dark-card rounded-xl p-6 mb-8 border border-gem-purple/30">
          <h2 className="text-xl font-bold text-gem-crystal mb-6">Hourly Distribution (UTC)</h2>
          <div className="relative">
            <div className="flex items-end justify-between gap-1" style={{ height: '200px' }}>
              {Object.entries(metrics.hourlyDistribution).map(([hour, count]) => {
                const height = maxHourly > 0 ? (count / maxHourly) * 100 : 0;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full relative group">
                      <div
                        className="bg-gradient-to-t from-gem-gold to-gem-crystal rounded-t transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${height * 2}px`, minHeight: count > 0 ? '4px' : '0' }}
                        title={`${hour}:00 - ${count} attestations`}
                      >
                        {count > 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-dark-bg text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {count}
                          </div>
                        )}
                      </div>
                    </div>
                    {parseInt(hour) % 3 === 0 && (
                      <div className="text-xs text-gray-500 mt-2">{hour}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leaderboard */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Attestation Leaderboard</h2>
            <div className="space-y-3">
              {metrics.leaderboard.map((entry) => (
                <div key={entry.wallet_address} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-gem-gold font-bold text-lg">#{entry.rank}</span>
                    <div>
                      <div className="text-white font-medium">
                        {entry.username ? `@${entry.username}` : formatAddress(entry.wallet_address)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Streak: {entry.current_streak} • Best: {entry.best_streak}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{entry.total_attestations}</div>
                    <div className="text-xs text-gray-500">attestations</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attestations */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Recent Attestations</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {metrics.recentAttestations.map((att, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <div>
                    <div className="text-white">
                      {att.username ? `@${att.username}` : formatAddress(att.wallet_address)}
                    </div>
                    <a
                      href={`https://basescan.org/tx/${att.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gem-gold hover:underline"
                    >
                      {att.tx_hash.slice(0, 10)}...
                    </a>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{getTimeAgo(att.created_at)}</div>
                    <div className="text-xs text-gray-500">Block #{att.block_number}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Distribution */}
        <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
          <h2 className="text-xl font-bold text-gem-crystal mb-4">Streak Analysis</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{metrics.streakDistribution.active}</div>
              <div className="text-gray-400 mt-2">Active Streaks</div>
              <div className="text-xs text-gray-500 mt-1">Currently maintaining</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{metrics.streakDistribution.broken}</div>
              <div className="text-gray-400 mt-2">Broken Streaks</div>
              <div className="text-xs text-gray-500 mt-1">Need to restart</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gem-gold">{metrics.streakDistribution.legendary}</div>
              <div className="text-gray-400 mt-2">Legendary Status</div>
              <div className="text-xs text-gray-500 mt-1">30+ day streaks</div>
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
  icon,
  trend,
  positive
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-gray-400 text-sm">{title}</h3>
        {icon && <div className="text-gem-gold">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p className={`text-sm mt-2 ${positive ? 'text-green-500' : positive === false ? 'text-red-500' : 'text-gray-500'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}