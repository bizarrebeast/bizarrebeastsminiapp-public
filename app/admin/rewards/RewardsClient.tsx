'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, CheckCircle, Clock, DollarSign, Users, TrendingUp, Copy, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { REWARDS_CONFIG } from '@/lib/rewards-config';

interface RewardRecord {
  id: number;
  wallet_address: string;
  username?: string;
  farcaster_fid?: number;
  milestone_type: string;
  token_reward: string;
  achieved_date: string;
  claimed_date: string | null;
  tx_hash: string | null;
  nft_minted: boolean;
  current_streak: number;
  best_streak: number;
  total_attestations: number;
  status: 'pending' | 'claimed';
}

interface RewardStats {
  total_pending: number;
  total_claimed: number;
  pending_7_day: number;
  pending_30_day: number;
  pending_100_day: number;
  total_tokens_pending: string;
  total_tokens_distributed: string;
}

const MILESTONE_CONFIG = {
  '7_day': { label: '7-Day Streak', reward: '25000', icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  '30_day': { label: '30-Day Streak', reward: '1000000', icon: Trophy, color: 'text-gem-gold', bgColor: 'bg-gem-gold/10' },
  '100_day': { label: '100-Day Streak', reward: '5000000', icon: Flame, color: 'text-gem-pink', bgColor: 'bg-gem-pink/10' }
};

export default function RewardsClient() {
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'claimed'>('pending');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');
  const [markingClaimed, setMarkingClaimed] = useState<number | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/rewards');
      const data = await response.json();
      setRewards(data.rewards);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsClaimed = async (id: number, txHash: string) => {
    setMarkingClaimed(id);
    try {
      const response = await fetch('/api/admin/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tx_hash: txHash })
      });

      if (response.ok) {
        await fetchRewards();
      }
    } catch (error) {
      console.error('Error marking as claimed:', error);
    } finally {
      setMarkingClaimed(null);
    }
  };

  const formatTokenAmount = (amount: string) => {
    const num = parseInt(amount);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const filteredRewards = rewards.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (filter === 'claimed' && r.status !== 'claimed') return false;
    if (selectedMilestone !== 'all' && r.milestone_type !== selectedMilestone) return false;
    return true;
  });

  // Calculate total pending tokens for export
  const pendingTokensTotal = filteredRewards
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + parseInt(r.token_reward), 0);

  const exportPendingRewards = () => {
    const pending = rewards.filter(r => r.status === 'pending');
    const csv = [
      'Wallet Address,Username,Milestone,Tokens,Achieved Date',
      ...pending.map(r =>
        `${r.wallet_address},${r.username || 'N/A'},${MILESTONE_CONFIG[r.milestone_type as keyof typeof MILESTONE_CONFIG].label},${r.token_reward},${new Date(r.achieved_date).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending_rewards_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Attestation Rewards Dashboard
          </h1>
          <p className="text-gray-400 mb-4">Manage milestone rewards for attestation streaks</p>

          {/* Treasury Wallet Info */}
          <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gem-gold" />
              <div>
                <p className="text-xs text-gray-400">Treasury Wallet</p>
                <p className="font-mono text-sm text-white">{REWARDS_CONFIG.TREASURY_WALLET}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(REWARDS_CONFIG.TREASURY_WALLET)}
                className="p-2 hover:bg-dark-bg rounded-lg transition"
                title="Copy treasury address"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
              <a
                href={`${REWARDS_CONFIG.BASESCAN_URL}/address/${REWARDS_CONFIG.TREASURY_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-dark-bg rounded-lg transition"
                title="View on Basescan"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-card rounded-lg p-6 border border-gem-crystal/20">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-gem-crystal" />
                <span className="text-2xl font-bold text-white">{stats.total_pending}</span>
              </div>
              <p className="text-gray-400">Pending Rewards</p>
              <p className="text-sm text-gem-gold mt-1">{formatTokenAmount(stats.total_tokens_pending)} $BB</p>
            </div>

            <div className="bg-dark-card rounded-lg p-6 border border-gem-gold/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-gem-gold" />
                <span className="text-2xl font-bold text-white">{stats.total_claimed}</span>
              </div>
              <p className="text-gray-400">Claimed Rewards</p>
              <p className="text-sm text-gray-500 mt-1">{formatTokenAmount(stats.total_tokens_distributed)} $BB</p>
            </div>

            <div className="bg-dark-card rounded-lg p-6 border border-blue-400/20">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.pending_7_day}</span>
              </div>
              <p className="text-gray-400">7-Day Pending</p>
              <p className="text-sm text-blue-400 mt-1">25K $BB each</p>
            </div>

            <div className="bg-dark-card rounded-lg p-6 border border-gem-pink/20">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-8 h-8 text-gem-pink" />
                <span className="text-2xl font-bold text-white">{stats.pending_100_day}</span>
              </div>
              <p className="text-gray-400">100-Day Pending</p>
              <p className="text-sm text-gem-pink mt-1">5M $BB + NFT</p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-dark-card border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Rewards</option>
              <option value="pending">Pending Only</option>
              <option value="claimed">Claimed Only</option>
            </select>

            <select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="bg-dark-card border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Milestones</option>
              <option value="7_day">7-Day</option>
              <option value="30_day">30-Day</option>
              <option value="100_day">100-Day</option>
            </select>

            <button
              onClick={fetchRewards}
              className="p-2 bg-dark-card border border-gray-700 rounded-lg text-white hover:bg-gray-800"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {filter === 'pending' && filteredRewards.length > 0 && (
              <div className="text-sm text-gray-400 mr-4">
                Total to distribute: <span className="text-gem-gold font-bold">{formatTokenAmount(pendingTokensTotal.toString())} $BB</span>
              </div>
            )}
            <button
              onClick={exportPendingRewards}
              className="px-4 py-2 bg-gem-crystal/20 text-gem-crystal border border-gem-crystal/40 rounded-lg hover:bg-gem-crystal/30"
            >
              Export Pending CSV
            </button>
          </div>
        </div>

        {/* Rewards Table */}
        <div className="bg-dark-card rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">User</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Milestone</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Reward</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Streak</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Achieved</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Loading rewards...
                    </td>
                  </tr>
                ) : filteredRewards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No rewards found
                    </td>
                  </tr>
                ) : (
                  filteredRewards.map((reward) => {
                    const config = MILESTONE_CONFIG[reward.milestone_type as keyof typeof MILESTONE_CONFIG];
                    const Icon = config.icon;

                    return (
                      <tr key={reward.id} className="border-b border-gray-800 hover:bg-dark-card/50">
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">
                              {reward.username ? (
                                <span className="text-gem-crystal">@{reward.username}</span>
                              ) : (
                                <span className="font-mono text-sm">{reward.wallet_address.slice(0, 8)}...{reward.wallet_address.slice(-6)}</span>
                              )}
                            </p>
                            <button
                              onClick={() => copyAddress(reward.wallet_address)}
                              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mt-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy address
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <span className="font-medium">{config.label}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <p className="font-bold text-gem-gold">{formatTokenAmount(reward.token_reward)} $BB</p>
                          {reward.milestone_type === '100_day' && (
                            <p className="text-xs text-gem-pink mt-1">+ NFT</p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <p className="text-white">{reward.best_streak} days</p>
                          <p className="text-xs text-gray-500">Current: {reward.current_streak}</p>
                        </td>
                        <td className="p-4 text-center text-gray-400">
                          {new Date(reward.achieved_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center">
                          {reward.status === 'pending' ? (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-sm">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-sm">
                              Claimed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {reward.status === 'pending' ? (
                            <button
                              onClick={() => {
                                const txHash = prompt('Enter transaction hash:');
                                if (txHash) markAsClaimed(reward.id, txHash);
                              }}
                              disabled={markingClaimed === reward.id}
                              className="px-3 py-1 bg-gem-crystal/20 text-gem-crystal rounded hover:bg-gem-crystal/30 disabled:opacity-50"
                            >
                              {markingClaimed === reward.id ? 'Marking...' : 'Mark Claimed'}
                            </button>
                          ) : reward.tx_hash ? (
                            <a
                              href={`https://basescan.org/tx/${reward.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gem-crystal hover:text-gem-gold flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}