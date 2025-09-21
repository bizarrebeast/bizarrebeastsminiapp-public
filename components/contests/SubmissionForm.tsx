'use client';

import { useState, useEffect } from 'react';
import { Trophy, Upload, Loader2, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { Contest } from '@/lib/supabase';
import { getCachedBBBalance, formatTokenBalance } from '@/lib/tokenBalance';
import ShareButtons from '@/components/ShareButtons';
import { useNeynarContext } from '@neynar/react';

interface SubmissionFormProps {
  contest: Contest;
  userSubmissions?: any[];
  onSuccess?: () => void;
}

export default function SubmissionForm({ contest, userSubmissions = [], onSuccess }: SubmissionFormProps) {
  const { address, isConnected } = useWallet();
  const { farcasterUsername, farcasterFid, farcasterConnected } = useUnifiedAuthStore();
  const neynarContext = useNeynarContext();
  const [score, setScore] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [authSyncing, setAuthSyncing] = useState(false);

  // Sync Farcaster auth if needed when component mounts
  useEffect(() => {
    // If we're in Warpcast and Neynar has user but store is empty, wait a bit for sync
    if (neynarContext?.user && !farcasterUsername) {
      console.log('⏳ Waiting for Farcaster auth sync...');
      setAuthSyncing(true);

      // Give NeynarAuthIntegration component time to sync
      const syncTimeout = setTimeout(() => {
        setAuthSyncing(false);
        console.log('✅ Auth sync timeout complete');
      }, 1500); // 1.5 seconds should be enough

      return () => clearTimeout(syncTimeout);
    } else {
      setAuthSyncing(false);
    }
  }, [neynarContext?.user, farcasterUsername]);

  // Check token balance when wallet connects
  const verifyTokenBalance = async () => {
    if (!address) return false;

    setCheckingBalance(true);
    try {
      const balance = await getCachedBBBalance(address);
      setTokenBalance(balance);

      // Check if user meets requirements
      if (contest.min_bb_required > 0) {
        const userBalance = BigInt(balance);
        const required = BigInt(contest.min_bb_required);

        if (userBalance < required) {
          setError(`Insufficient $BB balance. You need ${formatTokenBalance(contest.min_bb_required.toString())} $BB`);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error checking balance:', err);
      setError('Failed to verify token balance');
      return false;
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setScreenshot(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    // Validate based on contest type
    if (contest.type === 'game_score' && !score) {
      setError('Please enter your score');
      return;
    }

    if (contest.type === 'game_score' && !screenshot) {
      setError('Please upload a screenshot');
      return;
    }

    // Verify token balance
    const hasBalance = await verifyTokenBalance();
    if (!hasBalance) return;

    setSubmitting(true);
    setError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('contestId', contest.id);
      formData.append('walletAddress', address);

      // Try to get Farcaster data from multiple sources (prioritize Neynar context)
      let finalUsername = null;
      let finalFid = null;

      // Check Neynar context first (most up-to-date in Warpcast)
      if (neynarContext?.user) {
        finalUsername = neynarContext.user.username;
        finalFid = neynarContext.user.fid;
        console.log('📱 Using Farcaster data from Neynar context');
      }
      // Fall back to store data if Neynar is empty
      else if (farcasterUsername) {
        finalUsername = farcasterUsername;
        finalFid = farcasterFid;
        console.log('💾 Using Farcaster data from store');
      }

      // Debug logging for Farcaster data
      console.log('🎯 Submission Form - Farcaster state:', {
        storeConnected: farcasterConnected,
        storeUsername: farcasterUsername,
        storeFid: farcasterFid,
        neynarUser: neynarContext?.user?.username,
        neynarFid: neynarContext?.user?.fid,
        finalUsername,
        finalFid,
        address,
        userAgent: navigator.userAgent
      });

      // Include Farcaster profile - be more permissive
      // Send username if we have it from ANY source
      if (finalUsername) {
        console.log('✅ Adding Farcaster username to submission:', finalUsername);
        formData.append('farcasterUsername', finalUsername);
        if (finalFid) {
          formData.append('farcasterFid', finalFid.toString());
        }
      } else {
        console.warn('⚠️ No Farcaster username available from any source');
      }

      if (score) {
        formData.append('score', score);
      }

      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      formData.append('tokenBalance', tokenBalance);

      // Submit to API
      const response = await fetch('/api/contests/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess(true);
      setScore('');
      setScreenshot(null);
      setScreenshotPreview('');

      // Don't auto-dismiss - let user navigate away after sharing

    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-gem-crystal mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Entry Submitted!</h3>
        <p className="text-gray-400">Your contest entry has been successfully submitted.</p>
        <p className="text-sm text-gray-500 mt-4">Good luck! 🍀</p>

        {/* Share your entry */}
        <div className="mt-6 mb-4">
          <p className="text-sm text-gray-400 mb-3">Share your entry:</p>
          <div className="flex justify-center">
            <ShareButtons
              shareType="contestEntry"
              contestData={{
                name: contest.name,
                description: contest.description || '',
                prize: contest.prize_amount ? `${formatTokenBalance(contest.prize_amount.toString())} $BB` : 'Amazing prizes',
                timeLeft: contest.end_date ?
                  (() => {
                    const end = new Date(contest.end_date);
                    const now = new Date();
                    const diff = end.getTime() - now.getTime();
                    if (diff <= 0) return 'Contest ended';
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
                    return `${hours} hour${hours > 1 ? 's' : ''} left`;
                  })() : 'Ongoing'
              }}
              contextUrl={`https://bbapp.bizarrebeasts.io/contests/${contest.id}`}
              buttonSize="md"
              showLabels={false}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {contest.max_entries_per_wallet > 1 && userSubmissions.length + 1 < contest.max_entries_per_wallet && (
            <button
              onClick={() => {
                setSuccess(false);
                setScore('');
                setScreenshot(null);
                setScreenshotPreview('');
                if (onSuccess) onSuccess(); // Trigger data refresh
              }}
              className="px-6 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       hover:border-gem-crystal/50 transition text-sm"
            >
              Submit Entry #{userSubmissions.length + 2}
            </button>
          )}

          {onSuccess && (
            <button
              onClick={onSuccess}
              className="px-6 py-2 text-gray-500 hover:text-gray-300 transition text-sm block w-full"
            >
              {contest.max_entries_per_wallet === 1 ? 'View Leaderboard' : 'Back to Contest'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-gem-gold" />
          <h2 className="text-xl font-bold">Submit Your Entry</h2>
        </div>
        {contest.max_entries_per_wallet > 1 && (
          <div className="text-sm text-gray-400">
            Entry {userSubmissions.length + 1} of {contest.max_entries_per_wallet}
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Please connect your wallet to submit an entry</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Score Input (for game contests only) */}
          {contest.type === 'game_score' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Score
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:border-gem-crystal
                         focus:outline-none transition"
                placeholder="Enter your score"
                required
                min="0"
              />
              {contest.game_name && (
                <p className="text-xs text-gray-500 mt-1">
                  Playing: {contest.game_name}
                </p>
              )}
            </div>
          )}

          {/* Screenshot/Image Upload */}
          {(contest.type === 'game_score' || contest.type === 'creative') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {contest.type === 'game_score' ? 'Screenshot Proof' : 'Image Submission'}
              </label>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="screenshot-upload"
                />

                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center gap-3 w-full px-4 py-6
                           bg-dark-bg border-2 border-dashed border-gray-700 rounded-lg
                           hover:border-gem-crystal/50 transition cursor-pointer"
                >
                  {screenshotPreview ? (
                    <div className="w-full">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-center text-sm text-gray-400 mt-2">
                        Click to change screenshot
                      </p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-500" />
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {contest.type === 'game_score' ? 'Upload Screenshot' : 'Upload Image'}
                        </p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Token Balance Display */}
          {contest.min_bb_required > 0 && (
            <div className="bg-dark-bg/50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Your $BB Balance:</span>
                {checkingBalance ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gem-crystal" />
                ) : (
                  <span className="text-white font-medium">
                    {formatTokenBalance(tokenBalance)} $BB
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">Required:</span>
                <span className="text-gem-crystal font-medium">
                  {formatTokenBalance(contest.min_bb_required.toString())} $BB
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || checkingBalance || authSyncing}
            className="w-full py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                     text-dark-bg font-bold rounded-lg hover:opacity-90
                     disabled:opacity-50 disabled:cursor-not-allowed transition
                     flex items-center justify-center gap-2"
          >
            {authSyncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing authentication...
              </>
            ) : submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Entry
              </>
            )}
          </button>

          {/* Rules Reminder */}
          <div className="text-xs text-gray-500 text-center">
            By submitting, you agree to the contest rules and terms.
            {contest.max_entries_per_wallet > 1 && (
              <span className="block mt-1">
                Max {contest.max_entries_per_wallet} entries per wallet.
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}