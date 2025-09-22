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
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Username platform selection
  const [usernamePlatform, setUsernamePlatform] = useState<'farcaster' | 'x'>('farcaster');
  const [manualUsername, setManualUsername] = useState('');
  const [validatingUsername, setValidatingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

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

  // Auto-fill username when Farcaster is connected
  useEffect(() => {
    if (usernamePlatform === 'farcaster') {
      // Prioritize Neynar context
      if (neynarContext?.user?.username) {
        setManualUsername(neynarContext.user.username);
        setUsernameValid(true);
      }
      // Fall back to store data
      else if (farcasterUsername) {
        setManualUsername(farcasterUsername);
        setUsernameValid(true);
      }
    } else {
      // Clear validation when switching to X
      setUsernameValid(null);
      setUsernameError(null);
    }
  }, [usernamePlatform, neynarContext?.user, farcasterUsername]);

  // Validate Farcaster username
  const validateFarcasterUsername = async (username: string) => {
    if (!username) {
      setUsernameValid(false);
      setUsernameError('Username is required');
      return false;
    }

    setValidatingUsername(true);
    setUsernameError(null);

    try {
      // Clean username (remove @ if present)
      const cleanUsername = username.replace('@', '').trim();

      // Call API to validate username (not FID)
      const response = await fetch(`/api/neynar/username/${cleanUsername}`);

      if (response.ok) {
        setUsernameValid(true);
        setUsernameError(null);
        return true;
      } else {
        setUsernameValid(false);
        setUsernameError('Username not found on Farcaster. Please switch to X.');
        return false;
      }
    } catch (error) {
      console.error('Username validation error:', error);
      setUsernameValid(false);
      setUsernameError('Could not validate username. Please switch to X.');
      return false;
    } finally {
      setValidatingUsername(false);
    }
  };

  // Debounced username validation
  useEffect(() => {
    if (usernamePlatform === 'farcaster' && manualUsername) {
      const timer = setTimeout(() => {
        validateFarcasterUsername(manualUsername);
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timer);
    }
  }, [manualUsername, usernamePlatform]);

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

    // Require image for game_score or gallery-enabled contests
    if ((contest.type === 'game_score' || contest.gallery_enabled) && !screenshot) {
      setError(contest.gallery_enabled ? 'Please upload your meme image' : 'Please upload a screenshot');
      return;
    }

    // Validate username requirement
    if (!manualUsername.trim()) {
      setError('Please enter your username');
      return;
    }

    // Validate Farcaster username if selected
    if (usernamePlatform === 'farcaster') {
      const isValid = await validateFarcasterUsername(manualUsername);
      if (!isValid) {
        setError('Invalid Farcaster username. Please check or switch to X.');
        return;
      }
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

      // Clean username (remove @ if present)
      const cleanUsername = manualUsername.replace('@', '').trim();

      // Add username with platform info
      if (usernamePlatform === 'farcaster') {
        formData.append('farcasterUsername', cleanUsername);

        // Try to get FID if available
        if (neynarContext?.user?.fid && neynarContext.user.username === cleanUsername) {
          formData.append('farcasterFid', neynarContext.user.fid.toString());
        } else if (farcasterFid && farcasterUsername === cleanUsername) {
          formData.append('farcasterFid', farcasterFid.toString());
        }

        console.log('✅ Submitting with Farcaster username:', cleanUsername);
      } else {
        // For X (Twitter), just send as username
        formData.append('username', cleanUsername);
        console.log('✅ Submitting with X username:', cleanUsername);
      }

      // Store platform in metadata
      formData.append('usernamePlatform', usernamePlatform);

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

      // Capture the submission ID from the response
      if (data.submission?.id) {
        setSubmissionId(data.submission.id);
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
              contextUrl={submissionId ? `https://bbapp.bizarrebeasts.io/contests/${contest.id}/submission/${submissionId}` : `https://bbapp.bizarrebeasts.io/contests/${contest.id}`}
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
          {/* Username Platform Selection - REQUIRED */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Select Your Platform <span className="text-red-400">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUsernamePlatform('farcaster')}
                className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  usernamePlatform === 'farcaster'
                    ? 'border-gem-crystal bg-gem-crystal/10 text-gem-crystal'
                    : 'border-gray-700 bg-dark-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">🟣</span>
                <span className="font-medium">Farcaster</span>
              </button>

              <button
                type="button"
                onClick={() => setUsernamePlatform('x')}
                className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  usernamePlatform === 'x'
                    ? 'border-gem-crystal bg-gem-crystal/10 text-gem-crystal'
                    : 'border-gray-700 bg-dark-bg text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">𝕏</span>
                <span className="font-medium">X (Twitter)</span>
              </button>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {usernamePlatform === 'farcaster' ? 'Farcaster' : 'X'} Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualUsername}
                  onChange={(e) => setManualUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 focus:border-gem-crystal
                           focus:outline-none transition pr-10"
                  placeholder={usernamePlatform === 'farcaster' ? 'username (without @)' : '@username'}
                  required
                />

                {/* Validation indicator */}
                {usernamePlatform === 'farcaster' && manualUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validatingUsername ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : usernameValid === true ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : usernameValid === false ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Validation message */}
              {usernamePlatform === 'farcaster' && usernameError && (
                <p className="text-xs text-red-400 mt-1">{usernameError}</p>
              )}
              {usernamePlatform === 'farcaster' && usernameValid && (
                <p className="text-xs text-green-400 mt-1">✓ Valid Farcaster username</p>
              )}
              {usernamePlatform === 'x' && (
                <p className="text-xs text-gray-500 mt-1">Enter your X (Twitter) username</p>
              )}
            </div>
          </div>

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
          {(contest.type === 'game_score' || contest.type === 'creative' || contest.gallery_enabled) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {contest.type === 'game_score' ? 'Screenshot Proof' :
                 contest.gallery_enabled ? 'Meme Image *' : 'Image Submission'}
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
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-500" />
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {contest.type === 'game_score' ? 'Upload Screenshot' :
                           contest.gallery_enabled ? 'Upload Your Meme' : 'Upload Image'}
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