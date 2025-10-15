'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Users } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface LeaderboardEntry {
  rank: number;
  identifier: string;
  wallet_address?: string;
  username?: string;
  farcaster_fid?: number;
  completion_count: number;
  last_completed_at?: string;
}

interface LeaderboardStats {
  totalCompletions: number;
  totalShares: number;
  uniqueUsers: number;
}

interface RitualLeaderboardProps {
  ritualId: string | number;
  ritualTitle?: string;
}

export default function RitualLeaderboard({ ritualId, ritualTitle }: RitualLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const wallet = useWallet();

  useEffect(() => {
    fetchLeaderboard();
  }, [ritualId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/rituals/leaderboard?ritualId=${ritualId}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setStats(data.stats);

      // Find current user's rank
      if (wallet.address) {
        const userEntry = data.leaderboard.find((entry: LeaderboardEntry) =>
          entry.wallet_address?.toLowerCase() === wallet.address?.toLowerCase()
        );
        if (userEntry) {
          setUserRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error('Error fetching ritual leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'Anonymous';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-gem-gold" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-gem-gold border-gem-gold/30 bg-gem-gold/5';
      case 2:
        return 'text-gray-300 border-gray-300/30 bg-gray-300/5';
      case 3:
        return 'text-orange-600 border-orange-600/30 bg-orange-600/5';
      default:
        return 'border-gray-700 bg-dark-card/50';
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-card rounded-xl border border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboard.length) {
    return (
      <div className="bg-dark-card rounded-xl border border-gray-700 p-6 text-center">
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No participants yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gem-gold" />
            Ritual Leaderboard
          </h3>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gem-crystal" />
              <span className="text-gray-400">{stats.totalCompletions} completed</span>
            </div>
          )}
        </div>

        {/* User's rank if they're participating */}
        {userRank && (
          <div className="bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg p-3 text-center">
            <p className="text-gem-crystal text-sm">
              Your Rank: <span className="font-bold text-lg">#{userRank}</span>
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard List - Scrollable */}
      <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
        {leaderboard.map((entry) => {
          const isCurrentUser = wallet.address?.toLowerCase() === entry.wallet_address?.toLowerCase();

          return (
            <div
              key={`${entry.rank}-${entry.identifier}`}
              className={`p-4 flex items-center justify-between transition-colors hover:bg-dark-card/50 ${
                isCurrentUser ? 'bg-gem-crystal/5 border-l-4 border-gem-crystal' : ''
              } ${getRankColor(entry.rank)}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center gap-2 min-w-[60px]">
                  {getRankIcon(entry.rank)}
                  <span className={`font-bold text-lg ${
                    entry.rank <= 3 ? '' : 'text-gray-400'
                  }`}>
                    #{entry.rank}
                  </span>
                </div>

                {/* User Info */}
                <div>
                  <p className="font-medium text-white">
                    {entry.username ? (
                      <span className="text-gem-crystal">@{entry.username}</span>
                    ) : (
                      <span className="text-gray-400">Anonymous</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Completion Count */}
              <div className="text-right">
                <p className="font-bold text-white text-lg">{entry.completion_count}</p>
                <p className="text-xs text-gray-500">completion{entry.completion_count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show total count if more than displayed */}
      {leaderboard.length > 0 && (
        <div className="p-3 text-center border-t border-gray-700 bg-dark-card/50">
          <p className="text-xs text-gray-400">
            Total participants: {leaderboard.length}
          </p>
        </div>
      )}
    </div>
  );
}