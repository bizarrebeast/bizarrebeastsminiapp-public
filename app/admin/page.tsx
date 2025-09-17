'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { contestQueries, Contest } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';

interface DashboardStats {
  totalContests: number;
  activeContests: number;
  totalParticipants: number;
  totalPrizePool: string;
  pendingSubmissions: number;
  todayCheckins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContests: 0,
    activeContests: 0,
    totalParticipants: 0,
    totalPrizePool: '0',
    pendingSubmissions: 0,
    todayCheckins: 0
  });
  const [recentContests, setRecentContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch contests
      const allContests = await contestQueries.getAllContests();
      const activeContests = allContests?.filter(c => c.status === 'active') || [];

      // Calculate total participants across all contests
      let totalParticipants = 0;
      let totalPrize = BigInt(0);

      for (const contest of activeContests) {
        const leaderboard = await contestQueries.getLeaderboard(contest.id);
        totalParticipants += leaderboard.length;
        if (contest.prize_amount) {
          totalPrize += BigInt(contest.prize_amount);
        }
      }

      setStats({
        totalContests: allContests?.length || 0,
        activeContests: activeContests.length,
        totalParticipants,
        totalPrizePool: formatTokenBalance(totalPrize.toString()),
        pendingSubmissions: 0, // Would need to implement submission status tracking
        todayCheckins: 0 // Would need check-in system
      });

      setRecentContests(allContests?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gem-crystal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's an overview of your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-gem-gold" />
            <span className="text-xs px-2 py-1 bg-gem-gold/20 text-gem-gold rounded-full">
              Contests
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalContests}</p>
          <p className="text-sm text-gray-400">Total Contests</p>
          <div className="mt-2 text-xs text-gem-crystal">
            {stats.activeContests} active
          </div>
        </div>

        <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-gem-purple" />
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
          <p className="text-sm text-gray-400">Total Participants</p>
        </div>

        <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-gem-blue" />
            <span className="text-xs text-gray-400">$BB</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalPrizePool}</p>
          <p className="text-sm text-gray-400">Total Prize Pool</p>
        </div>

        <div className="bg-dark-card border border-gem-pink/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-gem-pink" />
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.todayCheckins}</p>
          <p className="text-sm text-gray-400">Today's Check-ins</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Contests */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Contests</h2>
            <Link href="/admin/contests" className="text-gem-crystal hover:underline text-sm">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentContests.length > 0 ? (
              recentContests.map((contest) => (
                <div key={contest.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-white">{contest.name}</p>
                    <p className="text-xs text-gray-400">
                      {contest.start_date ? formatDate(contest.start_date) : 'Not started'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contest.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      contest.status === 'ended' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {contest.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No contests yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/contests">
              <button className="w-full p-4 bg-dark-bg rounded-lg hover:bg-gem-crystal/10 transition text-left">
                <Trophy className="w-6 h-6 text-gem-gold mb-2" />
                <p className="font-medium">Create Contest</p>
                <p className="text-xs text-gray-400">Launch new competition</p>
              </button>
            </Link>

            <Link href="/admin/contests/analytics">
              <button className="w-full p-4 bg-dark-bg rounded-lg hover:bg-gem-purple/10 transition text-left">
                <BarChart3 className="w-6 h-6 text-gem-purple mb-2" />
                <p className="font-medium">View Analytics</p>
                <p className="text-xs text-gray-400">Contest performance</p>
              </button>
            </Link>

            <button className="w-full p-4 bg-dark-bg rounded-lg opacity-50 cursor-not-allowed text-left">
              <Users className="w-6 h-6 text-gem-blue mb-2" />
              <p className="font-medium">User Management</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </button>

            <button className="w-full p-4 bg-dark-bg rounded-lg opacity-50 cursor-not-allowed text-left">
              <DollarSign className="w-6 h-6 text-gem-pink mb-2" />
              <p className="font-medium">Token Distribution</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed (Placeholder) */}
      <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-sm">New contest submission approved</p>
              <p className="text-xs text-gray-400">2 minutes ago</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
            <Trophy className="w-5 h-5 text-gem-gold" />
            <div className="flex-1">
              <p className="text-sm">Contest "Test Contest 5" started</p>
              <p className="text-xs text-gray-400">1 hour ago</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
            <Users className="w-5 h-5 text-gem-crystal" />
            <div className="flex-1">
              <p className="text-sm">5 new participants joined</p>
              <p className="text-xs text-gray-400">3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}