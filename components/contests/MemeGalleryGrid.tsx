'use client';

import { useState } from 'react';
import { Heart, Share2, X, Eye, Loader2 } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import { ContestSubmission, Contest } from '@/lib/supabase';
import { formatAddress } from '@/lib/utils';
import { formatTokenBalance } from '@/lib/tokenBalance';
import { useWallet } from '@/hooks/useWallet';

interface MemeGalleryGridProps {
  contest: Contest;
  submissions: ContestSubmission[];
  votingEnabled: boolean;
  displayVotes: boolean;
  onVote: (submissionId: string) => Promise<void>;
  userVotes: string[];
}

export default function MemeGalleryGrid({
  contest,
  submissions,
  votingEnabled,
  displayVotes,
  onVote,
  userVotes
}: MemeGalleryGridProps) {
  const { address, isConnected } = useWallet();
  const [selectedMeme, setSelectedMeme] = useState<ContestSubmission | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);

  const handleVote = async (submissionId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }

    setVotingId(submissionId);
    try {
      await onVote(submissionId);
    } finally {
      setVotingId(null);
    }
  };

  const getTimeLeft = (endDate?: string) => {
    if (!endDate) return 'Ongoing';

    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Contest ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  if (submissions.length === 0) {
    return (
      <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-12 text-center">
        <p className="text-gray-400">No submissions yet. Be the first to enter!</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden
                     hover:border-gem-crystal/40 transition-all"
          >
            {/* Meme Image */}
            <div
              className="relative aspect-square bg-dark-bg cursor-pointer group"
              onClick={() => setSelectedMeme(submission)}
            >
              {submission.screenshot_url ? (
                <img
                  src={submission.screenshot_url}
                  alt={`Meme by ${submission.username || formatAddress(submission.wallet_address)}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">No image</p>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                            transition-opacity flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>

              {/* Vote Count Badge */}
              {displayVotes && submission.vote_count !== undefined && submission.vote_count > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-dark-bg/80 backdrop-blur
                              rounded-full text-xs text-gem-crystal font-semibold">
                  {submission.vote_count} vote{submission.vote_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Meme Info */}
            <div className="p-4">
              {/* Creator */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium text-sm truncate">
                  {submission.username ? (
                    <>@{submission.username}</>
                  ) : (
                    formatAddress(submission.wallet_address)
                  )}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>

              {/* Caption if exists */}
              {submission.image_caption && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {submission.image_caption}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Vote Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(submission.id);
                  }}
                  disabled={!votingEnabled || votingId === submission.id || !isConnected}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2
                           rounded-lg font-medium transition-all text-sm ${
                    userVotes.includes(submission.id)
                      ? 'bg-gem-crystal text-dark-bg'
                      : 'bg-dark-bg border border-gray-700 hover:border-gem-crystal/50 text-white'
                  } ${(!votingEnabled || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {votingId === submission.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${
                      userVotes.includes(submission.id) ? 'fill-current' : ''
                    }`} />
                  )}
                  {userVotes.includes(submission.id) ? 'Voted' : 'Vote'}
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareMenuId(
                      shareMenuId === submission.id ? null : submission.id
                    );
                  }}
                  className="p-2 bg-dark-bg border border-gray-700 rounded-lg
                           hover:border-gem-crystal/50 transition-all"
                >
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Share Menu */}
              {shareMenuId === submission.id && (
                <div className="mt-2 p-2 bg-dark-bg border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">
                    Share & get votes:
                  </p>
                  <ShareButtons
                    shareType="contestEntry"
                    contestData={{
                      name: contest.name,
                      description: `Check out my meme entry! Vote for me!`,
                      prize: contest.prize_amount ?
                        `${formatTokenBalance(contest.prize_amount.toString())} $BB` :
                        'BIZARRE NFT',
                      timeLeft: getTimeLeft(contest.end_date)
                    }}
                    contextUrl={`https://bbapp.bizarrebeasts.io/contests/${contest.id}#${submission.id}`}
                    buttonSize="sm"
                    showLabels={false}
                    className="justify-center"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {selectedMeme && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMeme(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMeme(null)}
              className="absolute -top-12 right-0 text-white hover:text-gem-crystal
                       transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image */}
            {selectedMeme.screenshot_url && (
              <img
                src={selectedMeme.screenshot_url}
                alt="Full size meme"
                className="w-full h-auto rounded-lg"
              />
            )}

            {/* Info Bar */}
            <div className="mt-4 p-4 bg-dark-card rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-medium">
                  By {selectedMeme.username || formatAddress(selectedMeme.wallet_address)}
                </p>
                {selectedMeme.image_caption && (
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedMeme.image_caption}
                  </p>
                )}
                {displayVotes && selectedMeme.vote_count !== undefined && (
                  <p className="text-gem-crystal text-sm mt-2">
                    {selectedMeme.vote_count} vote{selectedMeme.vote_count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Vote Button in Modal */}
                <button
                  onClick={() => handleVote(selectedMeme.id)}
                  disabled={!votingEnabled || votingId === selectedMeme.id || !isConnected}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    userVotes.includes(selectedMeme.id)
                      ? 'bg-gem-crystal text-dark-bg'
                      : 'bg-dark-bg border border-gray-700 hover:border-gem-crystal/50 text-white'
                  } ${(!votingEnabled || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {votingId === selectedMeme.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${
                      userVotes.includes(selectedMeme.id) ? 'fill-current' : ''
                    }`} />
                  )}
                  {userVotes.includes(selectedMeme.id) ? 'Voted' : 'Vote'}
                </button>

                {/* Share Buttons */}
                <ShareButtons
                  shareType="contestEntry"
                  contestData={{
                    name: contest.name,
                    description: `Vote for this amazing meme!`,
                    prize: contest.prize_amount ?
                      `${formatTokenBalance(contest.prize_amount.toString())} $BB` :
                      'BIZARRE NFT',
                    timeLeft: getTimeLeft(contest.end_date)
                  }}
                  contextUrl={`https://bbapp.bizarrebeasts.io/contests/${contest.id}#${selectedMeme.id}`}
                  buttonSize="md"
                  showLabels={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}