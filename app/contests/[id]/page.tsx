'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  Users,
  Coins,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Lock,
  Camera,
  Share2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Target,
  Award,
  Search
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { contestQueries, Contest, ContestSubmission, ContestLeaderboard, ContestWinner } from '@/lib/supabase';
import { formatTokenBalance, getCachedBBBalance, meetsTokenRequirement } from '@/lib/tokenBalance';
import { FEATURES } from '@/lib/feature-flags';
import SubmissionForm from '@/components/contests/SubmissionForm';
import ShareButtons from '@/components/ShareButtons';
import VotingGallery from '@/components/contests/VotingGallery';
import MemeGalleryGrid from '@/components/contests/MemeGalleryGrid';
import ContestActionButtons from '@/components/contests/ContestActionButtons';
import { isBetweenDates } from '@/lib/utils';

export default function ContestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContestLeaderboard[]>([]);
  const [userSubmission, setUserSubmission] = useState<ContestSubmission | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<ContestSubmission[]>([]);
  const [winners, setWinners] = useState<ContestWinner[]>([]);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'leaderboard' | 'submit' | 'voting' | 'gallery'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedUser, setSearchedUser] = useState<ContestLeaderboard | null>(null);
  const [approvedSubmissions, setApprovedSubmissions] = useState<ContestSubmission[]>([]);
  const [userVoteIds, setUserVoteIds] = useState<string[]>([]);

  // Check if contests are enabled
  if (!FEATURES.CONTESTS) {
    router.push('/');
    return null;
  }

  useEffect(() => {
    if (id) {
      fetchContestData();
    }
  }, [id, address]);

  useEffect(() => {
    if (address && contest) {
      checkUserBalance();
    }
  }, [address, contest]);

  const fetchContestData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contest details
      const contestData = await contestQueries.getContest(id as string);
      setContest(contestData);

      // Fetch leaderboard
      const leaderboardData = await contestQueries.getLeaderboard(id as string);
      setLeaderboard(leaderboardData || []);

      // If contest has ended, fetch winners
      if (contestData.status === 'ended') {
        const winnersData = await contestQueries.getContestWinners(id as string);
        setWinners(winnersData || []);
      }

      // If voting is enabled, fetch approved submissions
      if (contestData.voting_enabled) {
        const submissions = await contestQueries.getContestSubmissions(id as string, 'approved');
        setApprovedSubmissions(submissions || []);
      }

      // If user is connected, check their submissions and votes
      if (address) {
        const submission = await contestQueries.getUserSubmission(id as string, address);
        setUserSubmission(submission);

        const submissions = await contestQueries.getUserSubmissions(id as string, address);
        setUserSubmissions(submissions);

        // Fetch user's existing votes if voting is enabled
        if (contestData.voting_enabled) {
          try {
            const userVotes = await contestQueries.getUserVotes(id as string, address);
            setUserVoteIds(userVotes);
            console.log('Loaded user votes:', userVotes);
          } catch (voteErr) {
            console.error('Error loading user votes:', voteErr);
            // Don't fail the whole page load if votes can't be fetched
          }
        }
      }
    } catch (err) {
      console.error('Error fetching contest data:', err);
      setError('Failed to load contest details');
    } finally {
      setLoading(false);
    }
  };

  const checkUserBalance = async () => {
    if (!address) return;

    try {
      const balance = await getCachedBBBalance(address);
      setUserBalance(balance);
    } catch (err) {
      console.error('Error checking balance:', err);
    }
  };

  const getContestStatus = () => {
    if (!contest) return null;

    const now = new Date();
    const start = contest.start_date ? new Date(contest.start_date) : null;
    const end = contest.end_date ? new Date(contest.end_date) : null;

    if (contest.status === 'ended') {
      return { label: 'Contest Ended', color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
    if (start && start > now) {
      return { label: 'Starting Soon', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    }
    if (end && end < now) {
      return { label: 'Ended', color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
    return { label: 'Active', color: 'bg-gem-crystal', textColor: 'text-gem-crystal' };
  };

  const getTimeRemaining = () => {
    if (!contest?.end_date) return null;

    const end = new Date(contest.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Contest has ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const handleVote = async (submissionId: string) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to vote');
      return;
    }

    try {
      // Check if user already voted
      const isRemovingVote = userVoteIds.includes(submissionId);

      const response = await fetch('/api/contests/vote', {
        method: isRemovingVote ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contest?.id,
          submissionId,
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to vote');
      }

      // Update local state
      if (isRemovingVote) {
        setUserVoteIds(prev => prev.filter(id => id !== submissionId));
        // Update vote count in submissions
        setApprovedSubmissions(prev => prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, vote_count: Math.max(0, (sub.vote_count || 0) - 1) }
            : sub
        ));
      } else {
        // Remove previous vote if single voting
        if (contest?.voting_type === 'single' && userVoteIds.length > 0) {
          const prevVoteId = userVoteIds[0];
          setApprovedSubmissions(prev => prev.map(sub =>
            sub.id === prevVoteId
              ? { ...sub, vote_count: Math.max(0, (sub.vote_count || 0) - 1) }
              : sub
          ));
        }

        setUserVoteIds(contest?.voting_type === 'single' ? [submissionId] : [...userVoteIds, submissionId]);
        // Update vote count in submissions
        setApprovedSubmissions(prev => prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, vote_count: (sub.vote_count || 0) + 1 }
            : sub
        ));
      }
    } catch (error) {
      console.error('Voting error:', error);
      alert(error instanceof Error ? error.message : 'Failed to vote');
    }
  };

  const canEnterContest = () => {
    if (!contest) return false;
    if (!isConnected) return false;
    if (userSubmission) return false; // Already entered
    if (contest.status !== 'active') return false;

    const now = new Date();
    const start = contest.start_date ? new Date(contest.start_date) : null;
    const end = contest.end_date ? new Date(contest.end_date) : null;

    if (start && start > now) return false;
    if (end && end < now) return false;

    // Check token requirement
    if (contest.min_bb_required > 0) {
      return meetsTokenRequirement(userBalance, contest.min_bb_required);
    }

    return true;
  };

  const getUserRank = () => {
    if (!address || !leaderboard.length) return null;

    const entry = leaderboard.find(
      (item) => item.wallet_address.toLowerCase() === address.toLowerCase()
    );

    return entry?.rank || null;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate time left for sharing
  const getTimeLeftText = () => {
    if (!contest) return '';
    if (contest.status === 'ended') return 'Contest ended';
    if (contest.status === 'draft') return 'Coming soon';
    return timeRemaining || 'Active now';
  };

  // Format prize for sharing
  const formatPrizeText = () => {
    if (!contest) return '';
    if (contest.prize_amount) {
      return `${formatTokenBalance(contest.prize_amount.toString())} $BB`;
    }
    return contest.prize_type || 'Amazing prizes';
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gem-crystal mx-auto mb-4" />
          <p className="text-gray-400">Loading contest details...</p>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error || 'Contest not found'}</p>
          <Link
            href="/contests"
            className="mt-4 inline-block px-4 py-2 bg-gem-crystal text-dark-bg rounded-lg hover:bg-gem-crystal/80 transition"
          >
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  const status = getContestStatus();
  const timeRemaining = getTimeRemaining();
  const userRank = getUserRank();
  const isContestActive = status?.label === 'Active';

  return (
    <div className="min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/contests"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gem-crystal transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Contests
        </Link>

        {/* Banner Image */}
        {contest.banner_image_url && (
          <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <img
              src={contest.banner_image_url}
              alt={contest.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Gradient overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 to-transparent" />
          </div>
        )}

        {/* Contest Header */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">{contest.name}</h1>
            {contest.description && (
              <p className="text-gray-400 mb-4">{contest.description}</p>
            )}
            {/* Share buttons moved below description for better mobile layout */}
            {contest && (
              <div className="flex justify-start">
                <ShareButtons
                  shareType="contest"
                  contestData={{
                    name: contest.name,
                    description: contest.description || 'Join this exciting contest!',
                    timeLeft: getTimeLeftText(),
                    prize: formatPrizeText()
                  }}
                  contextUrl={`https://bbapp.bizarrebeasts.io/contests/${id}`}
                  buttonSize="sm"
                  showLabels={false}
                />
              </div>
            )}
          </div>

          {/* Status and Time */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className={`px-3 py-1 ${status?.color} text-dark-bg text-sm font-semibold rounded-full`}>
              {status?.label}
            </span>
            {timeRemaining && isContestActive && (
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{timeRemaining} remaining</span>
              </div>
            )}
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {/* Prize */}
            {contest.prize_amount && (
              <div className="bg-dark-bg rounded-lg p-2 sm:p-3">
                <div className="flex items-center gap-2 text-gem-gold mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs">Prize Pool</span>
                </div>
                <p className="text-white font-bold">
                  {formatTokenBalance(contest.prize_amount.toString())} $BB
                </p>
              </div>
            )}

            {/* Entry Requirement */}
            <div className="bg-dark-bg rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2 text-gem-purple mb-1">
                <Lock className="w-4 h-4" />
                <span className="text-xs">Entry Requirement</span>
              </div>
              <p className="text-white font-bold">
                {contest.min_bb_required > 0
                  ? `${formatTokenBalance(contest.min_bb_required.toString())} $BB`
                  : 'Free Entry'}
              </p>
            </div>

            {/* Participants */}
            <div className="bg-dark-bg rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2 text-gem-blue mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Participants</span>
              </div>
              <p className="text-white font-bold">{leaderboard.length}</p>
            </div>

            {/* Your Status */}
            <div className="bg-dark-bg rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2 text-gem-crystal mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs">Your Status</span>
              </div>
              <p className="text-white font-bold">
                {userSubmission
                  ? userRank
                    ? `Rank #${userRank}`
                    : 'Pending Review'
                  : 'Not Entered'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === 'details'
                ? 'text-gem-crystal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Contest Details
            {activeTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
            )}
          </button>
          {!contest.gallery_enabled && (
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'text-gem-crystal'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Leaderboard ({leaderboard.length})
              {activeTab === 'leaderboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
              )}
            </button>
          )}
          {contest.voting_enabled && !contest.gallery_enabled && (
            <button
              onClick={() => setActiveTab('voting')}
              className={`px-4 py-2 font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'voting'
                  ? 'text-gem-crystal'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Vote ({approvedSubmissions?.length || 0})
              {activeTab === 'voting' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
              )}
            </button>
          )}
          {contest.gallery_enabled && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'text-gem-crystal'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Gallery ({approvedSubmissions.length})
              {contest.display_votes && (
                <span className="ml-1 text-xs">
                  • {approvedSubmissions.reduce((sum, sub) => sum + (sub.vote_count || 0), 0)} votes
                </span>
              )}
              {activeTab === 'gallery' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
              )}
            </button>
          )}
          {isContestActive && (userSubmissions.length < contest.max_entries_per_wallet) && (
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'submit'
                  ? 'text-gem-crystal'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {userSubmissions.length > 0 ? `Submit Entry (${userSubmissions.length + 1}/${contest.max_entries_per_wallet})` : 'Submit Entry'}
              {activeTab === 'submit' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gem-crystal" />
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Contest Rules & Information</h2>

            {contest.rules ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{contest.rules}</p>
              </div>
            ) : (
              <p className="text-gray-400">No additional rules specified for this contest.</p>
            )}

            {/* Contest Type Info */}
            <div className="mt-6 p-4 bg-dark-bg rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Contest Type: {contest.type.replace('_', ' ')}</h3>
              {contest.type === 'game_score' && (
                <div className="space-y-2 text-gray-300">
                  <p>📸 Submit a screenshot of your game over screen</p>
                  <p>🎮 Enter your final score</p>
                  <p>⏰ One submission per wallet</p>
                  <p>✅ Admin will verify submissions</p>
                </div>
              )}
              {contest.type === 'onboarding' && (
                <div className="space-y-2 text-gray-300">
                  <p>🚀 Complete all required tasks</p>
                  <p>📝 Submit proof of completion</p>
                  <p>🎁 Receive Member NFT upon verification</p>
                  <p>🔓 Gain access to Farcaster channel</p>
                </div>
              )}
              {contest.type === 'creative' && (
                <div className="space-y-2 text-gray-300">
                  <p>🎨 Create and submit your entry</p>
                  <p>🗳️ Community voting determines winners</p>
                  <p>🏆 Multiple prize categories</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isContestActive && (userSubmissions.length < contest.max_entries_per_wallet) && (
              <div className="mt-6">
                {!isConnected ? (
                  <div className="p-4 bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg text-center">
                    <Lock className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
                    <p className="text-white mb-2">Connect your wallet to enter this contest</p>
                  </div>
                ) : canEnterContest() ? (
                  <ContestActionButtons
                    contest={contest}
                    contestId={id as string}
                    variant="stacked"
                    className="w-full"
                    onSubmitClick={() => setActiveTab('submit')}
                  />
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                    <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400">
                      {contest.min_bb_required > 0 && !meetsTokenRequirement(userBalance, contest.min_bb_required)
                        ? `You need ${formatTokenBalance(contest.min_bb_required.toString())} $BB to enter (You have ${formatTokenBalance(userBalance)} $BB)`
                        : 'You cannot enter this contest'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {userSubmission && (
              <div className="mt-6 p-4 bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
                <p className="text-center text-white font-semibold">You have already entered this contest!</p>
                {userRank && (
                  <p className="text-center text-gem-crystal mt-2">Current Rank: #{userRank}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No submissions yet</p>
                <p className="text-gray-500 text-sm mt-2">Be the first to enter!</p>
              </div>
            ) : (
              <div>
                {/* Search Bar */}
                <div className="p-4 bg-dark-bg border-b border-gray-700">
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Find the user in leaderboard for sharing
                        const term = e.target.value.toLowerCase();
                        const found = leaderboard.find(entry =>
                          entry.wallet_address.toLowerCase().includes(term) ||
                          (entry.username && entry.username.toLowerCase().includes(term))
                        );
                        setSearchedUser(found || null);
                      }}
                      placeholder="Search by username or wallet address..."
                      className="w-full pl-10 pr-4 py-2 bg-dark-card border border-gray-700 rounded-lg
                               text-white placeholder-gray-500 focus:border-gem-crystal
                               focus:outline-none transition"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSearchedUser(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                                 hover:text-white transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Share Your Rank Section */}
                {searchedUser && (
                  <div className="p-4 bg-gradient-to-r from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10 border-b border-gem-gold/30">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-gem-gold" />
                      {searchedUser.wallet_address.toLowerCase() === address?.toLowerCase() ? 'Your' : 'Player'} Contest Position
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gem-crystal">
                            #{searchedUser.rank}
                          </span>
                          <div>
                            <p className="text-white font-medium">
                              {searchedUser.username ? (
                                <span className="text-gem-crystal">@{searchedUser.username}</span>
                              ) : (
                                formatAddress(searchedUser.wallet_address)
                              )}
                            </p>
                            {searchedUser.username && (
                              <p className="text-gray-400 text-sm">{formatAddress(searchedUser.wallet_address)}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{searchedUser.score.toLocaleString()}</p>
                          <p className="text-gray-400 text-sm">points</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-400">Share this rank:</p>
                        <ShareButtons
                          shareType="contestPosition"
                          contestData={{
                            name: contest.name,
                            description: contest.description || '',
                            position: searchedUser.rank,
                            score: searchedUser.score.toLocaleString()
                          }}
                          contextUrl={`https://bbapp.bizarrebeasts.io/contests/${id}`}
                          buttonSize="md"
                          showLabels={false}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="w-full">
                  <table className="w-full">
                    <thead className="bg-dark-bg">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Rank</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Player</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {(() => {
                        const filteredEntries = leaderboard.filter(entry => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            entry.wallet_address.toLowerCase().includes(term) ||
                            (entry.username && entry.username.toLowerCase().includes(term))
                          );
                        });

                        if (filteredEntries.length === 0 && searchTerm) {
                          return (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center">
                                <Search className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-gray-400">No results found for "{searchTerm}"</p>
                                <button
                                  onClick={() => setSearchTerm('')}
                                  className="text-gem-crystal hover:text-gem-crystal/80 text-sm mt-2"
                                >
                                  Clear search
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return filteredEntries.map((entry, index) => {
                      const isUser = address && entry.wallet_address.toLowerCase() === address.toLowerCase();
                      const isTop3 = entry.rank <= 3;

                      return (
                        <tr
                          key={entry.wallet_address}
                          className={`${isUser ? 'bg-gem-crystal/5' : ''} hover:bg-dark-bg/50 transition group`}
                        >
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {isTop3 && (
                                <Award
                                  className={`w-4 sm:w-5 h-4 sm:h-5 ${
                                    entry.rank === 1
                                      ? 'text-gem-gold'
                                      : entry.rank === 2
                                      ? 'text-gray-300'
                                      : 'text-orange-400'
                                  }`}
                                />
                              )}
                              <span className={`font-semibold text-sm sm:text-base ${isTop3 ? 'text-white' : 'text-gray-400'}`}>
                                #{entry.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-white text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                                  {entry.username ? (
                                    <span className="text-gem-crystal">@{entry.username}</span>
                                  ) : (
                                    formatAddress(entry.wallet_address)
                                  )}
                                </span>
                                {entry.username && (
                                  <p className="text-gray-400 text-xs truncate">{formatAddress(entry.wallet_address)}</p>
                                )}
                                {isUser && (
                                  <span className="px-1.5 sm:px-2 py-0.5 bg-gem-crystal/20 text-gem-crystal text-xs rounded-full">
                                    YOU
                                  </span>
                                )}
                              </div>
                              {/* Share button for each row */}
                              <button
                                onClick={() => {
                                  // Set this entry as searched to show share section
                                  setSearchedUser(entry);
                                  setSearchTerm(entry.username || entry.wallet_address);
                                  // Scroll to top to see share section
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="ml-1 sm:ml-2 p-1 text-gray-400 hover:text-gem-crystal transition opacity-0 group-hover:opacity-100"
                                title="Share this rank"
                              >
                                <Share2 className="w-3 sm:w-4 h-3 sm:h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className="text-white font-mono font-semibold text-sm sm:text-base">
                              {entry.score.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-gray-400 text-sm hidden sm:table-cell">
                            {new Date(entry.submitted_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    });
                      })()}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && isContestActive && (userSubmissions.length < contest.max_entries_per_wallet) && (
          <SubmissionForm
            contest={contest}
            userSubmissions={userSubmissions}
            onSuccess={() => {
              fetchContestData(); // Refresh data after submission
              // Only switch to leaderboard if max submissions reached
              if (userSubmissions.length + 1 >= contest.max_entries_per_wallet) {
                setActiveTab('leaderboard');
              }
              // Otherwise stay on submit tab for additional entries
            }}
          />
        )}

        {/* Message when user has reached submission limit */}
        {activeTab === 'submit' && isContestActive && userSubmissions.length >= contest.max_entries_per_wallet && (
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-gem-crystal" />
              <h2 className="text-xl font-bold text-white">Submission Complete</h2>
            </div>
            <p className="text-gray-300 mb-4">
              You've reached the maximum number of submissions ({contest.max_entries_per_wallet}) for this contest.
            </p>
            <div className="space-y-3 mb-4">
              {userSubmissions.map((submission, index) => (
                <div key={submission.id} className="bg-dark-bg rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Entry #{index + 1}</p>
                      <p className="text-xl font-bold text-white">{submission.score?.toLocaleString() || 'Pending'}</p>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="px-4 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-semibold rounded-lg hover:opacity-90 transition"
            >
              View Leaderboard
            </button>
          </div>
        )}

        {/* Voting Tab */}
        {activeTab === 'voting' && contest.voting_enabled && (
          <div>
            {/* Voting Status */}
            {contest.voting_start_date || contest.voting_end_date ? (
              <div className="mb-4 p-4 bg-dark-card border border-gem-crystal/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Voting Period</h3>
                    {contest.voting_start_date && new Date(contest.voting_start_date) > new Date() ? (
                      <p className="text-yellow-400">
                        Voting starts: {new Date(contest.voting_start_date).toLocaleDateString()}
                      </p>
                    ) : contest.voting_end_date && new Date(contest.voting_end_date) < new Date() ? (
                      <p className="text-red-400">Voting has ended</p>
                    ) : (
                      <p className="text-gem-crystal">Voting is open!</p>
                    )}
                    {contest.voting_end_date && new Date(contest.voting_end_date) > new Date() && (
                      <p className="text-gray-400 text-sm mt-1">
                        Ends: {new Date(contest.voting_end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {contest.min_votes_required && contest.min_votes_required > 1 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Min votes required</p>
                      <p className="text-xl font-bold text-white">{contest.min_votes_required}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Voting Gallery */}
            <VotingGallery
              contestId={contest.id}
              submissions={approvedSubmissions}
              votingEnabled={isBetweenDates(contest.voting_start_date, contest.voting_end_date)}
              votingType={contest.voting_type}
            />
          </div>
        )}

        {/* Gallery Tab - Grid View for Memes */}
        {activeTab === 'gallery' && contest.gallery_enabled && (
          <div>
            {/* Voting Status */}
            {contest.voting_enabled && (contest.voting_start_date || contest.voting_end_date) && (
              <div className="mb-4 p-4 bg-dark-card border border-gem-crystal/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Community Voting</h3>
                    {contest.voting_start_date && new Date(contest.voting_start_date) > new Date() ? (
                      <p className="text-yellow-400">
                        Voting starts: {new Date(contest.voting_start_date).toLocaleDateString()}
                      </p>
                    ) : contest.voting_end_date && new Date(contest.voting_end_date) < new Date() ? (
                      <p className="text-red-400">
                        Voting ended: {new Date(contest.voting_end_date).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-gem-crystal">
                        Voting is open!
                        {contest.voting_end_date && (
                          <span className="text-gray-400">
                            {' '}(ends {new Date(contest.voting_end_date).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {contest.min_votes_required && contest.min_votes_required > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Min votes required</p>
                      <p className="text-lg font-bold text-gem-crystal">{contest.min_votes_required}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meme Gallery Grid */}
            <MemeGalleryGrid
              contest={contest}
              submissions={approvedSubmissions}
              votingEnabled={!!contest.voting_enabled && isBetweenDates(contest.voting_start_date, contest.voting_end_date)}
              displayVotes={contest.display_votes ?? true}
              onVote={handleVote}
              userVotes={userVoteIds}
            />
          </div>
        )}

        {/* Winners Section (for ended contests) */}
        {contest.status === 'ended' && winners.length > 0 && (
          <div className="mt-6 bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">🏆 Contest Winners</h2>
            <div className="space-y-3">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Award
                      className={`w-6 h-6 ${
                        winner.position === 1
                          ? 'text-gem-gold'
                          : winner.position === 2
                          ? 'text-gray-300'
                          : 'text-orange-400'
                      }`}
                    />
                    <div>
                      <p className="text-white font-semibold">
                        Position #{winner.position}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatAddress(winner.wallet_address)}
                      </p>
                    </div>
                  </div>
                  {winner.prize_amount && (
                    <div className="text-right">
                      <p className="text-gem-crystal font-bold">
                        {formatTokenBalance(winner.prize_amount.toString())} $BB
                      </p>
                      {winner.prize_distributed && (
                        <p className="text-green-400 text-xs">Distributed ✓</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}