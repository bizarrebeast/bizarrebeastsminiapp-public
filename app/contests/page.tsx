'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Clock, Users, Coins, ChevronRight, Loader2, AlertCircle, Calendar, Lock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { contestQueries, Contest, ActiveContestView } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';
import { FEATURES } from '@/lib/feature-flags';

export default function ContestsPage() {
  const { isConnected, address } = useWallet();
  const [activeContests, setActiveContests] = useState<ActiveContestView[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [endedContests, setEndedContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'ended'>('active');

  // Check if contests are enabled
  if (!FEATURES.CONTESTS) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-400 mb-2">Coming Soon</h1>
          <p className="text-gray-500">Contests will be available soon!</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log('Contests page mounted, fetching contests...');
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching contests from Supabase...');

      // Fetch all contest types in parallel
      const [active, upcoming, ended] = await Promise.all([
        contestQueries.getActiveContestsWithStats(),
        contestQueries.getUpcomingContests(),
        contestQueries.getEndedContests(5),
      ]);

      console.log('Contests fetched:', { active, upcoming, ended });

      setActiveContests(active || []);
      setUpcomingContests(upcoming || []);
      setEndedContests(ended || []);
    } catch (err) {
      console.error('Error fetching contests:', err);
      setError(`Failed to load contests: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getContestTypeIcon = (type: string) => {
    switch (type) {
      case 'game_score':
        return '🎮';
      case 'onboarding':
        return '🚀';
      case 'creative':
        return '🎨';
      case 'tiered':
        return '🏆';
      default:
        return '🏆';
    }
  };

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = contest.start_date ? new Date(contest.start_date) : null;
    const end = contest.end_date ? new Date(contest.end_date) : null;

    if (start && start > now) {
      return { label: 'Starting Soon', color: 'text-yellow-400' };
    }
    if (end && end < now) {
      return { label: 'Ended', color: 'text-gray-400' };
    }
    return { label: 'Active', color: 'text-gem-crystal' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  const ContestCard = ({ contest, isActive = false }: { contest: Contest | ActiveContestView; isActive?: boolean }) => {
    const status = getContestStatus(contest);
    const hasParticipants = 'participant_count' in contest && contest.participant_count > 0;

    return (
      <Link href={`/contests/${contest.id}`}>
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 hover:border-gem-crystal/40 transition-all duration-300 cursor-pointer group">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getContestTypeIcon(contest.type)}</span>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-gem-crystal transition-colors">
                  {contest.name}
                </h3>
                <span className={`text-xs ${status.color}`}>{status.label}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gem-crystal transition-colors" />
          </div>

          {/* Description */}
          {contest.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{contest.description}</p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Prize */}
            {contest.prize_amount && (
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-gem-gold" />
                <div className="text-sm">
                  <span className="text-gray-400">Prize: </span>
                  <span className="text-white font-semibold">
                    {formatTokenBalance(contest.prize_amount.toString())} $BB
                  </span>
                </div>
              </div>
            )}

            {/* Token Requirement */}
            {contest.min_bb_required > 0 && (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gem-purple" />
                <div className="text-sm">
                  <span className="text-gray-400">Requires: </span>
                  <span className="text-white font-semibold">
                    {formatTokenBalance(contest.min_bb_required.toString())} $BB
                  </span>
                </div>
              </div>
            )}

            {/* Participants */}
            {hasParticipants && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gem-blue" />
                <div className="text-sm">
                  <span className="text-gray-400">Entries: </span>
                  <span className="text-white font-semibold">
                    {(contest as ActiveContestView).participant_count}
                  </span>
                </div>
              </div>
            )}

            {/* Time */}
            {contest.end_date && isActive && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gem-pink" />
                <span className="text-sm text-white font-semibold">
                  {getTimeRemaining(contest.end_date)}
                </span>
              </div>
            )}
          </div>

          {/* Dates for upcoming/ended */}
          {!isActive && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {contest.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {status.label === 'Ended' ? 'Ended' : 'Starts'} {formatDate(contest.start_date)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Prize Type Badge */}
          <div className="flex gap-2 mt-4">
            <span className="px-2 py-1 bg-gem-crystal/10 text-gem-crystal text-xs rounded-full">
              {contest.type.replace('_', ' ')}
            </span>
            {contest.prize_type === 'nft' && (
              <span className="px-2 py-1 bg-gem-gold/10 text-gem-gold text-xs rounded-full">
                NFT Reward
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gem-crystal mx-auto mb-4" />
          <p className="text-gray-400">Loading contests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchContests}
            className="mt-4 px-4 py-2 bg-gem-crystal text-dark-bg rounded-lg hover:bg-gem-crystal/80 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            BizarreBeasts Contests
          </h1>
          <p className="text-gray-400 text-lg">
            Compete, create, and win prizes in the most BIZARRE competitions!
          </p>
        </div>

        {/* Wallet Connection Prompt */}
        {!isConnected && (
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 mb-8 text-center">
            <Lock className="w-8 h-8 text-gem-crystal mx-auto mb-3" />
            <p className="text-white mb-2">Connect your wallet to enter contests</p>
            <p className="text-gray-400 text-sm">
              Some contests require $BB tokens to enter
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'active'
                ? 'text-gem-crystal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active ({activeContests.length})
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'upcoming'
                ? 'text-gem-crystal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upcoming ({upcomingContests.length})
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'ended'
                ? 'text-gem-crystal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ended ({endedContests.length})
            {activeTab === 'ended' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
            )}
          </button>
        </div>

        {/* Contest Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {activeTab === 'active' && activeContests.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No active contests at the moment</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new competitions!</p>
            </div>
          )}

          {activeTab === 'active' && activeContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} isActive={true} />
          ))}

          {activeTab === 'upcoming' && upcomingContests.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming contests scheduled</p>
            </div>
          )}

          {activeTab === 'upcoming' && upcomingContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}

          {activeTab === 'ended' && endedContests.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No ended contests to display</p>
            </div>
          )}

          {activeTab === 'ended' && endedContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </div>
    </div>
  );
}