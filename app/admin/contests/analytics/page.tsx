'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Eye,
  Share2,
  ChevronLeft,
  Loader2,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { validateAdminAccess } from '@/lib/admin';
import { contestQueries, Contest } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';

interface ContestAnalytics {
  contestId: string;
  contestName: string;
  status: string;
  totalEntries: number;
  uniqueParticipants: number;
  averageScore: number;
  highestScore: number;
  prizePool: string;
  startDate: string;
  endDate: string;
  dailyEntries: { date: string; count: number }[];
  topPerformers: { wallet: string; username?: string; score: number }[];
}

export default function ContestAnalyticsPage() {
  const router = useRouter();
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ContestAnalytics | null>(null);

  // Admin check
  useEffect(() => {
    if (address && !validateAdminAccess(address)) {
      router.push('/');
    }
  }, [address, router]);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const allContests = await contestQueries.getAllContests();
      setContests(allContests || []);

      // Auto-select the first active contest
      const activeContest = allContests?.find(c => c.status === 'active');
      if (activeContest) {
        setSelectedContest(activeContest.id);
        fetchAnalytics(activeContest.id);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (contestId: string) => {
    try {
      // Fetch contest details and submissions
      const contest = contests.find(c => c.id === contestId);
      if (!contest) return;

      const leaderboard = await contestQueries.getLeaderboard(contestId);

      // Calculate analytics
      const uniqueParticipants = new Set(leaderboard.map(e => e.wallet_address)).size;
      const scores = leaderboard.map(e => e.score);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Group entries by day
      const entriesByDay: { [key: string]: number } = {};
      leaderboard.forEach(entry => {
        const date = new Date(entry.submitted_at).toLocaleDateString();
        entriesByDay[date] = (entriesByDay[date] || 0) + 1;
      });

      const dailyEntries = Object.entries(entriesByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Get top performers
      const topPerformers = leaderboard
        .slice(0, 5)
        .map(entry => ({
          wallet: entry.wallet_address,
          username: entry.username,
          score: entry.score
        }));

      setAnalytics({
        contestId: contest.id,
        contestName: contest.name,
        status: contest.status,
        totalEntries: leaderboard.length,
        uniqueParticipants,
        averageScore,
        highestScore,
        prizePool: contest.prize_amount ? formatTokenBalance(contest.prize_amount.toString()) : '0',
        startDate: contest.start_date || '',
        endDate: contest.end_date || '',
        dailyEntries,
        topPerformers
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!address || !validateAdminAccess(address)) {
    return null;
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Contest Analytics
          </h1>
          <p className="text-gray-400 mt-2">Track performance and engagement metrics for your contests</p>
        </div>

        {/* Contest Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Contest
          </label>
          <select
            value={selectedContest || ''}
            onChange={(e) => {
              setSelectedContest(e.target.value);
              if (e.target.value) {
                fetchAnalytics(e.target.value);
              }
            }}
            className="w-full md:w-auto px-4 py-2 bg-dark-card border border-gray-700 rounded-lg
                     text-white focus:border-gem-crystal focus:outline-none transition"
          >
            <option value="">Choose a contest...</option>
            {contests.map(contest => (
              <option key={contest.id} value={contest.id}>
                {contest.name} ({contest.status})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gem-crystal" />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-8 h-8 text-gem-gold" />
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    analytics.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    analytics.status === 'ended' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {analytics.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Total Entries</p>
                <p className="text-2xl font-bold text-white">{analytics.totalEntries}</p>
              </div>

              <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-6">
                <Users className="w-8 h-8 text-gem-purple mb-2" />
                <p className="text-gray-400 text-sm">Unique Participants</p>
                <p className="text-2xl font-bold text-white">{analytics.uniqueParticipants}</p>
              </div>

              <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-6">
                <TrendingUp className="w-8 h-8 text-gem-blue mb-2" />
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-white">{analytics.averageScore.toFixed(0)}</p>
              </div>

              <div className="bg-dark-card border border-gem-pink/20 rounded-lg p-6">
                <DollarSign className="w-8 h-8 text-gem-pink mb-2" />
                <p className="text-gray-400 text-sm">Prize Pool</p>
                <p className="text-2xl font-bold text-white">{analytics.prizePool} $BB</p>
              </div>
            </div>

            {/* Contest Details */}
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Contest Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Contest Name</p>
                  <p className="text-white font-medium">{analytics.contestName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Start Date</p>
                  <p className="text-white">{new Date(analytics.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">End Date</p>
                  <p className="text-white">
                    {analytics.endDate ? new Date(analytics.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Entries Chart (simplified) */}
            {analytics.dailyEntries.length > 0 && (
              <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gem-crystal" />
                  Daily Entry Trends
                </h2>
                <div className="space-y-2">
                  {analytics.dailyEntries.map((day, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm w-24">{day.date}</span>
                      <div className="flex-1 bg-dark-bg rounded-full h-6 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gem-crystal to-gem-gold rounded-full"
                          style={{ width: `${(day.count / Math.max(...analytics.dailyEntries.map(d => d.count))) * 100}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-medium">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Performers */}
            {analytics.topPerformers.length > 0 && (
              <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gem-gold" />
                  Top Performers
                </h2>
                <div className="space-y-3">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-gem-gold' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-white font-medium">
                            {performer.username || formatAddress(performer.wallet)}
                          </p>
                          {performer.username && (
                            <p className="text-gray-500 text-xs">{formatAddress(performer.wallet)}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-white font-bold">{performer.score.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics (Placeholder for future) */}
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Engagement Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <Eye className="w-8 h-8 text-gem-blue mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Page Views</p>
                  <p className="text-xl font-bold text-white">Coming Soon</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <Share2 className="w-8 h-8 text-gem-purple mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Total Shares</p>
                  <p className="text-xl font-bold text-white">Coming Soon</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <Clock className="w-8 h-8 text-gem-pink mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Avg. Time on Page</p>
                  <p className="text-xl font-bold text-white">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        ) : selectedContest ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No analytics data available for this contest</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Select a contest to view analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}