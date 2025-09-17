'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2, AlertCircle, Check, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { ContestSubmission } from '@/lib/supabase';
import { formatAddress } from '@/lib/utils';

interface VotingGalleryProps {
  contestId: string;
  submissions: ContestSubmission[];
  votingEnabled: boolean;
  votingType?: 'single' | 'multiple' | 'ranked';
}

export default function VotingGallery({
  contestId,
  submissions,
  votingEnabled,
  votingType = 'single'
}: VotingGalleryProps) {
  const { address, isConnected } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contestId) {
      fetchVotingData();
    }
  }, [contestId, address]);

  const fetchVotingData = async () => {
    try {
      // Fetch voting results
      const response = await fetch(`/api/contests/vote?contestId=${contestId}`);
      const data = await response.json();

      if (data.results) {
        const counts: { [key: string]: number } = {};
        data.results.forEach((result: any) => {
          counts[result.submission_id] = result.votes || 0;
        });
        setVoteCounts(counts);
      }

      // Fetch user's vote if connected
      if (address) {
        const voteResponse = await fetch(`/api/contests/vote?contestId=${contestId}&walletAddress=${address}`);
        const voteData = await voteResponse.json();
        if (voteData.vote) {
          setUserVote(voteData.vote.submission_id);
        }
      }
    } catch (err) {
      console.error('Error fetching voting data:', err);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet to vote');
      return;
    }

    if (!votingEnabled) {
      setError('Voting is not enabled for this contest');
      return;
    }

    setLoadingVote(submissionId);
    setError(null);

    try {
      const isRemovingVote = userVote === submissionId;

      const response = await fetch('/api/contests/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          submissionId: isRemovingVote ? undefined : submissionId,
          walletAddress: address,
          action: isRemovingVote ? 'remove' : 'cast'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cast vote');
      }

      // Update local state
      if (isRemovingVote) {
        setUserVote(null);
        setVoteCounts(prev => ({
          ...prev,
          [submissionId]: Math.max(0, (prev[submissionId] || 0) - 1)
        }));
      } else {
        // Remove vote from previous submission if single vote
        if (userVote && votingType === 'single') {
          setVoteCounts(prev => ({
            ...prev,
            [userVote]: Math.max(0, (prev[userVote] || 0) - 1)
          }));
        }

        setUserVote(submissionId);
        setVoteCounts(prev => ({
          ...prev,
          [submissionId]: (prev[submissionId] || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    } finally {
      setLoadingVote(null);
    }
  };

  const navigateSubmission = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : submissions.length - 1));
    } else {
      setCurrentIndex(prev => (prev < submissions.length - 1 ? prev + 1 : 0));
    }
  };

  const currentSubmission = submissions[currentIndex];
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  if (!currentSubmission) {
    return (
      <div className="text-center py-8 text-gray-400">
        No approved submissions to vote on yet.
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
      {/* Gallery Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Vote for Your Favorite</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {currentIndex + 1} of {submissions.length}
            </span>
            {totalVotes > 0 && (
              <span className="text-sm text-gem-crystal">
                {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submission Display */}
      <div className="relative">
        {/* Navigation Buttons */}
        {submissions.length > 1 && (
          <>
            <button
              onClick={() => navigateSubmission('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-bg/80 backdrop-blur
                       border border-gray-700 rounded-lg hover:bg-dark-bg hover:border-gem-crystal/50
                       transition-all"
              aria-label="Previous submission"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateSubmission('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-bg/80 backdrop-blur
                       border border-gray-700 rounded-lg hover:bg-dark-bg hover:border-gem-crystal/50
                       transition-all"
              aria-label="Next submission"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image/Content */}
        <div className="relative aspect-video bg-dark-bg">
          {currentSubmission.screenshot_url ? (
            <img
              src={currentSubmission.screenshot_url}
              alt={`Submission by ${currentSubmission.username || formatAddress(currentSubmission.wallet_address)}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No image provided</p>
                {currentSubmission.metadata?.description && (
                  <p className="text-gray-400 px-8">{currentSubmission.metadata.description}</p>
                )}
              </div>
            </div>
          )}

          {/* View Full Size */}
          {currentSubmission.screenshot_url && (
            <a
              href={currentSubmission.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 p-2 bg-dark-bg/80 backdrop-blur border border-gray-700
                       rounded-lg hover:bg-dark-bg hover:border-gem-crystal/50 transition-all"
              aria-label="View full size"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Submission Info */}
        <div className="p-4 bg-dark-bg/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-medium">
                {currentSubmission.username || formatAddress(currentSubmission.wallet_address)}
              </p>
              {currentSubmission.username && (
                <p className="text-gray-500 text-xs">{formatAddress(currentSubmission.wallet_address)}</p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                Submitted {new Date(currentSubmission.submitted_at).toLocaleDateString()}
              </p>
            </div>

            {/* Vote Button */}
            <button
              onClick={() => handleVote(currentSubmission.id)}
              disabled={!votingEnabled || loadingVote === currentSubmission.id || !isConnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                userVote === currentSubmission.id
                  ? 'bg-gem-crystal text-dark-bg hover:bg-gem-crystal/80'
                  : 'bg-dark-card border border-gray-700 hover:border-gem-crystal/50 text-white'
              } ${(!votingEnabled || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingVote === currentSubmission.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : userVote === currentSubmission.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
              <span>
                {userVote === currentSubmission.id ? 'Voted' : 'Vote'}
              </span>
              <span className="ml-2 px-2 py-0.5 bg-dark-bg/50 rounded text-sm">
                {voteCounts[currentSubmission.id] || 0}
              </span>
            </button>
          </div>

          {/* Additional metadata */}
          {currentSubmission.metadata && (
            <div className="pt-4 border-t border-gray-700">
              {currentSubmission.metadata.title && (
                <h4 className="text-white font-medium mb-2">{currentSubmission.metadata.title}</h4>
              )}
              {currentSubmission.metadata.description && (
                <p className="text-gray-400 text-sm">{currentSubmission.metadata.description}</p>
              )}
              {currentSubmission.metadata.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentSubmission.metadata.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gem-crystal/10 text-gem-crystal text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {submissions.length > 1 && (
        <div className="p-4 border-t border-gray-700 bg-dark-bg/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {submissions.map((submission, idx) => (
              <button
                key={submission.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-gem-crystal'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {submission.screenshot_url ? (
                  <img
                    src={submission.screenshot_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">#{idx + 1}</span>
                  </div>
                )}
                {userVote === submission.id && (
                  <div className="absolute inset-0 bg-gem-crystal/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-gem-crystal" fill="currentColor" />
                  </div>
                )}
                {(voteCounts[submission.id] || 0) > 0 && (
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-dark-bg/80 rounded text-xs text-white">
                    {voteCounts[submission.id]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}