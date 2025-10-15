'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { isAdmin } from '@/lib/admin';
import { Coins, Gift, Trophy, Users, Calendar } from 'lucide-react';

interface MonthlyPrize {
  id: string;
  month: string;
  name: string;
  description: string;
  value: string;
  imageUrl: string;
  drawingDate: string;
  status: string;
  winner?: string;
}

interface BonusSpin {
  id: string;
  recipient: string;
  username: string | null;
  spinsRemaining: number;
  spinsAwarded: number;
  spinsUsed: number;
  reason: string;
  awardedBy: string;
  awardedAt: string;
  expiresAt: string | null;
}

interface DrawingStats {
  month: string;
  prize: {
    name: string;
    status: string;
    drawingDate: string;
  } | null;
  stats: {
    totalParticipants: number;
    totalEntries: number;
    avgEntriesPerUser: string;
    readyToDraw: boolean;
  };
  winner: {
    wallet: string;
    username: string | null;
    totalEntries: number;
    drawnAt: string;
  } | null;
}

interface OverallStats {
  totalFlips: number;
  totalWinnings: string;
  totalWithdrawals: string;
  totalPlayers: number;
  recentFlips: Array<{
    id: string;
    wallet: string;
    username: string | null;
    choice: string;
    result: string;
    isWinner: boolean;
    payout: string;
    createdAt: string;
    isBonusFlip: boolean;
  }>;
}

export default function FlipAdminPage() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<'analytics' | 'bonus' | 'prizes' | 'draw'>('analytics');

  // Bonus spins state
  const [recipient, setRecipient] = useState('');
  const [spins, setSpins] = useState('5');
  const [reason, setReason] = useState('');
  const [expiresIn, setExpiresIn] = useState('never');
  const [recentAwards, setRecentAwards] = useState<BonusSpin[]>([]);
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState('');
  const [awardError, setAwardError] = useState('');

  // Prize state
  const [prizes, setPrizes] = useState<MonthlyPrize[]>([]);
  const [prizeMonth, setPrizeMonth] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeValue, setPrizeValue] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [drawingDate, setDrawingDate] = useState('');
  const [prizeLoading, setPrizeLoading] = useState(false);
  const [prizeSuccess, setPrizeSuccess] = useState('');
  const [prizeError, setPrizeError] = useState('');

  // Drawing state
  const [drawingStats, setDrawingStats] = useState<DrawingStats | null>(null);
  const [drawMonth, setDrawMonth] = useState('');
  const [drawLoading, setDrawLoading] = useState(false);
  const [drawSuccess, setDrawSuccess] = useState('');
  const [drawError, setDrawError] = useState('');
  const [winner, setWinner] = useState<any>(null);

  // Analytics state
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (address && isAdmin(address)) {
      loadStats();
      loadRecentAwards();
      loadPrizes();

      // Set current month for drawing
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7) + '-01';
      setDrawMonth(currentMonth);
      loadDrawingStats(currentMonth);
    }
  }, [address]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/admin/flip/analytics', {
        headers: {
          'x-wallet-address': address || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadRecentAwards = async () => {
    try {
      const response = await fetch('/api/admin/flip/award-spins', {
        headers: {
          'x-wallet-address': address || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentAwards(data.awards || []);
      }
    } catch (error) {
      console.error('Failed to load recent awards:', error);
    }
  };

  const loadPrizes = async () => {
    try {
      const response = await fetch('/api/admin/flip/set-prize', {
        headers: {
          'x-wallet-address': address || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrizes(data.prizes || []);
      }
    } catch (error) {
      console.error('Failed to load prizes:', error);
    }
  };

  const loadDrawingStats = async (month: string) => {
    try {
      const response = await fetch(`/api/admin/flip/draw-winner?month=${month}`, {
        headers: {
          'x-wallet-address': address || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDrawingStats(data);
      }
    } catch (error) {
      console.error('Failed to load drawing stats:', error);
    }
  };

  const handleAwardSpins = async (e: React.FormEvent) => {
    e.preventDefault();
    setAwardLoading(true);
    setAwardError('');
    setAwardSuccess('');

    try {
      const response = await fetch('/api/admin/flip/award-spins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({
          recipient,
          spins: parseInt(spins),
          reason,
          expiresIn
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAwardSuccess(data.message);
        setRecipient('');
        setSpins('5');
        setReason('');
        loadRecentAwards();
      } else {
        const error = await response.json();
        setAwardError(error.error || 'Failed to award spins');
      }
    } catch (error) {
      setAwardError('Failed to award spins');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleSetPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrizeLoading(true);
    setPrizeError('');
    setPrizeSuccess('');

    try {
      const response = await fetch('/api/admin/flip/set-prize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({
          month: prizeMonth,
          prizeName,
          prizeDescription,
          prizeValue,
          prizeImageUrl,
          drawingDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrizeSuccess(data.message);
        setPrizeMonth('');
        setPrizeName('');
        setPrizeDescription('');
        setPrizeValue('');
        setPrizeImageUrl('');
        setDrawingDate('');
        loadPrizes();
      } else {
        const error = await response.json();
        setPrizeError(error.error || 'Failed to set prize');
      }
    } catch (error) {
      setPrizeError('Failed to set prize');
    } finally {
      setPrizeLoading(false);
    }
  };

  const handleDrawWinner = async () => {
    if (!confirm(`Are you sure you want to draw the winner for ${drawMonth}? This cannot be undone.`)) {
      return;
    }

    setDrawLoading(true);
    setDrawError('');
    setDrawSuccess('');
    setWinner(null);

    try {
      const response = await fetch('/api/admin/flip/draw-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({ month: drawMonth })
      });

      if (response.ok) {
        const data = await response.json();
        setDrawSuccess(data.message);
        setWinner(data.winner);
        loadDrawingStats(drawMonth);
      } else {
        const error = await response.json();
        setDrawError(error.error || 'Failed to draw winner');
      }
    } catch (error) {
      setDrawError('Failed to draw winner');
    } finally {
      setDrawLoading(false);
    }
  };

  if (!address || !isAdmin(address)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            🪙 Flip Admin
          </h1>
          <p className="text-gray-400">Manage bonus spins, prizes, and drawings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'bonus'
                ? 'text-gem-crystal border-b-2 border-gem-crystal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Bonus Spins
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'prizes'
                ? 'text-gem-gold border-b-2 border-gem-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Monthly Prizes
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'draw'
                ? 'text-gem-pink border-b-2 border-gem-pink'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins className="w-5 h-5 inline mr-2" />
            Draw Winner
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="text-center py-12 text-gray-400">Loading analytics...</div>
            ) : stats ? (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-gem-crystal">{stats.totalFlips}</div>
                    <div className="text-sm text-gray-400 mt-2">Total Flips</div>
                  </div>
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-gem-gold">{stats.totalPlayers}</div>
                    <div className="text-sm text-gray-400 mt-2">Total Players</div>
                  </div>
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-gem-pink">
                      {(parseFloat(stats.totalWinnings) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">$BB Won</div>
                  </div>
                  <div className="bg-dark-card border border-gray-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-green-400">
                      {(parseFloat(stats.totalWithdrawals) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">$BB Withdrawn</div>
                  </div>
                </div>

                {/* Recent Flips */}
                <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Flips</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-sm text-gray-400">Player</th>
                          <th className="text-left py-2 px-3 text-sm text-gray-400">Choice</th>
                          <th className="text-left py-2 px-3 text-sm text-gray-400">Result</th>
                          <th className="text-left py-2 px-3 text-sm text-gray-400">Outcome</th>
                          <th className="text-left py-2 px-3 text-sm text-gray-400">Type</th>
                          <th className="text-right py-2 px-3 text-sm text-gray-400">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentFlips.map((flip) => (
                          <tr key={flip.id} className="border-b border-gray-800">
                            <td className="py-3 px-3 text-sm">
                              {flip.username || `${flip.wallet.slice(0, 6)}...${flip.wallet.slice(-4)}`}
                            </td>
                            <td className="py-3 px-3 text-sm capitalize">{flip.choice}</td>
                            <td className="py-3 px-3 text-sm capitalize">{flip.result}</td>
                            <td className="py-3 px-3">
                              {flip.isWinner ? (
                                <span className="text-green-400 font-semibold">
                                  Won {(parseFloat(flip.payout) / 1e18).toLocaleString()} $BB
                                </span>
                              ) : (
                                <span className="text-gray-400">Lost</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-sm">
                              {flip.isBonusFlip ? (
                                <span className="text-gem-crystal">Bonus</span>
                              ) : (
                                <span className="text-gray-400">Daily</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-sm text-right text-gray-400">
                              {new Date(flip.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">No data available</div>
            )}
          </div>
        )}

        {/* Bonus Spins Tab */}
        {activeTab === 'bonus' && (
          <div className="space-y-6">
            {/* Award Form */}
            <div className="bg-dark-card border border-gem-crystal/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-gem-crystal">Award Bonus Spins</h2>
              <form onSubmit={handleAwardSpins} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Recipient (Wallet Address or FID)
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x... or 12345"
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Spins</label>
                    <input
                      type="number"
                      value={spins}
                      onChange={(e) => setSpins(e.target.value)}
                      min="1"
                      max="100"
                      className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Expires In</label>
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                    >
                      <option value="never">Never</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Community contest winner, etc."
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={awardLoading}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-gem-crystal to-gem-gold font-bold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {awardLoading ? 'Awarding...' : 'Award Bonus Spins'}
                </button>
              </form>

              {awardSuccess && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-400">
                  {awardSuccess}
                </div>
              )}

              {awardError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
                  {awardError}
                </div>
              )}
            </div>

            {/* Recent Awards */}
            <div className="bg-dark-card border border-gem-crystal/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Recent Awards</h3>
              <div className="space-y-3">
                {recentAwards.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No bonus spins awarded yet</p>
                ) : (
                  recentAwards.map((award) => (
                    <div
                      key={award.id}
                      className="bg-dark-panel rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          {award.username || award.recipient}
                        </div>
                        <div className="text-sm text-gray-400">{award.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gem-gold font-bold">
                          {award.spinsRemaining} / {award.spinsAwarded} left
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(award.awardedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prizes Tab */}
        {activeTab === 'prizes' && (
          <div className="space-y-6">
            {/* Set Prize Form */}
            <div className="bg-dark-card border border-gem-gold/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-gem-gold">Set Monthly Prize</h2>
              <form onSubmit={handleSetPrize} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Month (YYYY-MM-01)</label>
                  <input
                    type="text"
                    value={prizeMonth}
                    onChange={(e) => setPrizeMonth(e.target.value)}
                    placeholder="2025-11-01"
                    pattern="\d{4}-\d{2}-01"
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: YYYY-MM-01 (e.g., 2025-11-01)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Prize Name</label>
                  <input
                    type="text"
                    value={prizeName}
                    onChange={(e) => setPrizeName(e.target.value)}
                    placeholder="Unopened VibeCard Pack"
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={prizeDescription}
                    onChange={(e) => setPrizeDescription(e.target.value)}
                    placeholder="Win an unopened pack..."
                    rows={3}
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prize Value</label>
                    <input
                      type="text"
                      value={prizeValue}
                      onChange={(e) => setPrizeValue(e.target.value)}
                      placeholder="Unopened VibeCard Pack"
                      className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Drawing Date (UTC)</label>
                    <input
                      type="datetime-local"
                      value={drawingDate}
                      onChange={(e) => setDrawingDate(e.target.value)}
                      className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="text"
                    value={prizeImageUrl}
                    onChange={(e) => setPrizeImageUrl(e.target.value)}
                    placeholder="/assets/page-assets/banners/..."
                    className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={prizeLoading}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-gem-gold to-gem-pink font-bold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {prizeLoading ? 'Setting Prize...' : 'Set Monthly Prize'}
                </button>
              </form>

              {prizeSuccess && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-400">
                  {prizeSuccess}
                </div>
              )}

              {prizeError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
                  {prizeError}
                </div>
              )}
            </div>

            {/* Existing Prizes */}
            <div className="bg-dark-card border border-gem-gold/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Configured Prizes</h3>
              <div className="space-y-3">
                {prizes.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No prizes configured yet</p>
                ) : (
                  prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className="bg-dark-panel rounded-lg p-4 flex items-start gap-4"
                    >
                      {prize.imageUrl && (
                        <img
                          src={prize.imageUrl}
                          alt={prize.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{prize.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            prize.status === 'active' ? 'bg-green-900/30 text-green-400' :
                            prize.status === 'drawn' ? 'bg-blue-900/30 text-blue-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {prize.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(prize.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-400">
                          Drawing: {new Date(prize.drawingDate).toLocaleDateString()}
                        </div>
                        {prize.winner && (
                          <div className="text-sm text-gem-gold mt-1">
                            Winner: {prize.winner}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Draw Winner Tab */}
        {activeTab === 'draw' && (
          <div className="space-y-6">
            {/* Month Selector */}
            <div className="bg-dark-card border border-gem-pink/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-gem-pink">Draw Monthly Winner</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Month</label>
                <input
                  type="text"
                  value={drawMonth}
                  onChange={(e) => {
                    setDrawMonth(e.target.value);
                    loadDrawingStats(e.target.value);
                  }}
                  placeholder="2025-10-01"
                  pattern="\d{4}-\d{2}-01"
                  className="w-full p-3 rounded-lg bg-dark-panel border border-gray-700 text-white"
                />
              </div>

              {/* Stats */}
              {drawingStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-dark-panel rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gem-crystal">
                        {drawingStats.stats.totalParticipants}
                      </div>
                      <div className="text-sm text-gray-400">Participants</div>
                    </div>
                    <div className="bg-dark-panel rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gem-gold">
                        {drawingStats.stats.totalEntries}
                      </div>
                      <div className="text-sm text-gray-400">Total Entries</div>
                    </div>
                    <div className="bg-dark-panel rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gem-pink">
                        {drawingStats.stats.avgEntriesPerUser}
                      </div>
                      <div className="text-sm text-gray-400">Avg per User</div>
                    </div>
                  </div>

                  {drawingStats.prize && (
                    <div className="bg-dark-panel rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Prize</div>
                      <div className="text-lg font-bold">{drawingStats.prize.name}</div>
                      <div className="text-sm text-gray-400">
                        Drawing: {new Date(drawingStats.prize.drawingDate).toLocaleDateString()}
                      </div>
                      <div className={`text-sm mt-2 ${
                        drawingStats.prize.status === 'active' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        Status: {drawingStats.prize.status}
                      </div>
                    </div>
                  )}

                  {/* Draw Button */}
                  {drawingStats.stats.readyToDraw && !drawingStats.winner && (
                    <button
                      onClick={handleDrawWinner}
                      disabled={drawLoading}
                      className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-gem-pink to-gem-crystal font-bold text-black text-xl hover:opacity-90 disabled:opacity-50"
                    >
                      {drawLoading ? '🎲 Drawing...' : '🎯 DRAW WINNER'}
                    </button>
                  )}

                  {/* Winner Display */}
                  {(winner || drawingStats.winner) && (
                    <div className="bg-gem-crystal/10 border-2 border-gem-crystal rounded-xl p-6 animate-in fade-in">
                      <div className="text-center mb-4">
                        <div className="text-5xl mb-2">🎉</div>
                        <h3 className="text-2xl font-bold text-gem-crystal mb-2">Winner Drawn!</h3>
                      </div>
                      <div className="bg-dark-panel rounded-lg p-4">
                        <div className="text-lg font-bold mb-2">
                          {(winner?.username || drawingStats.winner?.username) ||
                           (winner?.wallet || drawingStats.winner?.wallet)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total Entries: {winner?.totalEntries || drawingStats.winner?.totalEntries}
                        </div>
                        {winner?.odds && (
                          <div className="text-sm text-gem-gold mt-1">
                            Odds: {winner.odds}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {drawSuccess && (
                    <div className="p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-400">
                      {drawSuccess}
                    </div>
                  )}

                  {drawError && (
                    <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
                      {drawError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
