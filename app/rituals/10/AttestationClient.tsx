'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { Trophy, Flame, TrendingUp, Share2, CheckCircle, Zap, Clock, AlertCircle, ArrowLeft, Info, DollarSign } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';

// Mock mode for testing without contract
const MOCK_MODE = true; // Set to false when contract is deployed

interface AttestationStats {
  totalAttestations: number;
  currentStreak: number;
  bestStreak: number;
  lastAttestationDate: string | null;
  rank: number;
  canAttestToday: boolean;
  timeUntilNext: number;
}

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username?: string;
  farcaster_fid?: number;
  total_attestations: number;
  current_streak: number;
  best_streak: number;
}

export default function AttestationClient() {
  const router = useRouter();
  const wallet = useWallet();
  const [userStats, setUserStats] = useState<AttestationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isAttesting, setIsAttesting] = useState(false);
  const [attestationComplete, setAttestationComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gasEstimate] = useState<string>('~$0.01');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Always load data even without wallet
    loadData();

    // Update countdown timer
    const timer = setInterval(() => {
      updateCountdown();
    }, 60000);

    updateCountdown(); // Initial update

    return () => clearInterval(timer);
  }, [wallet.address]);

  const loadData = async () => {
    setLoading(true);

    // Set default values first
    if (!wallet.address) {
      setUserStats(null);
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    try {
      // Load user stats from API
      const statsRes = await fetch(`/api/attestations/stats?wallet=${wallet.address}`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setUserStats(stats);
      } else {
        // Default stats if API not ready
        setUserStats({
          totalAttestations: 0,
          currentStreak: 0,
          bestStreak: 0,
          lastAttestationDate: null,
          rank: 0,
          canAttestToday: true,
          timeUntilNext: 0
        });
      }

      // Check if already attested today from localStorage
      const today = new Date().toDateString();
      const stored = localStorage.getItem('bizarreRitualsData');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today && data.rituals?.includes(10)) {
          setAttestationComplete(true);
        }
      }

      // Load leaderboard
      const leaderboardRes = await fetch('/api/attestations/leaderboard?limit=50');
      if (leaderboardRes.ok) {
        const leaders = await leaderboardRes.json();
        setLeaderboard(leaders);
      }
    } catch (error) {
      console.error('Error loading attestation data:', error);
      // Set default values on error
      setUserStats({
        totalAttestations: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastAttestationDate: null,
        rank: 0,
        canAttestToday: true,
        timeUntilNext: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setTimeUntilReset(`${hours}h ${minutes}m until daily reset`);
  };

  const handleAttest = async () => {
    if (!wallet.address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsAttesting(true);
    setError('');

    try {
      if (MOCK_MODE) {
        // Mock attestation for testing
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction delay

        // Mock transaction hash
        setTxHash('0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

        // Update mock stats
        if (userStats) {
          setUserStats({
            ...userStats,
            totalAttestations: userStats.totalAttestations + 1,
            currentStreak: userStats.currentStreak + 1,
            bestStreak: Math.max(userStats.bestStreak, userStats.currentStreak + 1),
            lastAttestationDate: new Date().toISOString(),
            canAttestToday: false
          });
        }

        setAttestationComplete(true);
      } else {
        // Real contract interaction will go here
        // const provider = new ethers.BrowserProvider(wallet.provider);
        // const signer = await provider.getSigner();
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        // const tx = await contract.attestBizarre();
        // setTxHash(tx.hash);
        // await tx.wait();

        // Record in database
        await fetch('/api/attestations/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: wallet.address,
            txHash: txHash,
            blockNumber: 0, // Will be real block number
            gasUsed: '0'
          })
        });
      }

      // Mark ritual as complete
      const today = new Date().toDateString();
      const stored = localStorage.getItem('bizarreRitualsData') || '{}';
      const data = JSON.parse(stored);
      const rituals = data.date === today ? (data.rituals || []) : [];

      if (!rituals.includes(10)) {
        rituals.push(10);
        localStorage.setItem('bizarreRitualsData', JSON.stringify({
          date: today,
          rituals: rituals,
          featuredCompleted: data.featuredCompleted || false
        }));
      }

      // Reload stats
      await loadData();
    } catch (error: any) {
      console.error('Attestation failed:', error);
      setError(error.message || 'Attestation failed. Please try again.');
    } finally {
      setIsAttesting(false);
    }
  };

  const getStreakEmojis = (streak: number) => {
    if (streak >= 100) return '👹🔥🔥🔥🔥🔥';
    if (streak >= 30) return '🔥🔥🔥🔥🔥';
    if (streak >= 14) return '🔥🔥🔥🔥';
    if (streak >= 7) return '🔥🔥🔥';
    if (streak >= 3) return '🔥🔥';
    if (streak >= 1) return '🔥';
    return '';
  };

  const shareAttestation = () => {
    if (userStats && userStats.totalAttestations > 0) {
      return `I just made my ${userStats.totalAttestations}th BIZARRE attestation on-chain! 👹\n\n` +
             `Current Streak: ${userStats.currentStreak} days ${getStreakEmojis(userStats.currentStreak)}\n` +
             `Leaderboard Rank: #${userStats.rank || '∞'}\n` +
             `Best Streak: ${userStats.bestStreak} days\n\n` +
             `Who else dares to attest they are BIZARRE?\n\n` +
             `#BizarreBeasts #IAmBizarre #BaseNetwork`;
    }
    return `I just attested I AM BIZARRE on-chain! 👹\n\nJoin the daily BIZARRE attestation ritual!\n\n#BizarreBeasts #IAmBizarre #BaseNetwork`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gem-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attestation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/rituals')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-dark-card rounded-lg border border-gem-crystal/30 hover:border-gem-crystal/50 hover:bg-dark-panel transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-gem-crystal group-hover:transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-gem-crystal">Back to Rituals</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            👹 BIZARRE On-Chain Attestation 👹
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            Declare "I AM BIZARRE" on the Base blockchain forever!
          </p>
          <p className="text-sm text-gray-500">
            {timeUntilReset} | Gas: {gasEstimate}
            {MOCK_MODE && <span className="text-gem-gold ml-2">(Mock Mode)</span>}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* User Stats Card */}
        {wallet.address && userStats && (
          <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/10 border-2 border-gem-gold rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gem-gold">Your Attestation Stats</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/30">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-gem-gold" />
                  <span className="text-gray-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{userStats.totalAttestations}</p>
              </div>

              <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-400 text-sm">Streak</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {userStats.currentStreak}
                </p>
                <p className="text-xs">{getStreakEmojis(userStats.currentStreak)}</p>
              </div>

              <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-gem-pink" />
                  <span className="text-gray-400 text-sm">Best</span>
                </div>
                <p className="text-2xl font-bold text-white">{userStats.bestStreak}</p>
              </div>

              <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-gem-crystal" />
                  <span className="text-gray-400 text-sm">Rank</span>
                </div>
                <p className="text-2xl font-bold text-white">#{userStats.rank || '∞'}</p>
              </div>
            </div>

            {/* Attestation Button and Share */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleAttest}
                disabled={!userStats.canAttestToday || isAttesting || attestationComplete}
                className={`px-8 py-3 rounded-lg font-bold text-lg transition-all transform flex items-center gap-2 ${
                  attestationComplete
                    ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40 cursor-not-allowed'
                    : userStats.canAttestToday
                    ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:scale-105 animate-pulse'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {attestationComplete ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Attested Today!
                  </>
                ) : isAttesting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-bg"></div>
                    Attesting...
                  </>
                ) : userStats.canAttestToday ? (
                  <>
                    🫵 ATTEST: I AM BIZARRE 👹
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Cooldown Active
                  </>
                )}
              </button>

              {(attestationComplete || userStats.totalAttestations > 0) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Share:</span>
                  <ShareButtons
                    customText={shareAttestation()}
                    shareType="default"
                    buttonSize="md"
                    showLabels={false}
                    contextUrl="https://bbapp.bizarrebeasts.io/rituals/10"
                  />
                </div>
              )}
            </div>

            {/* Transaction Link */}
            {txHash && (
              <div className="mt-4 p-3 bg-dark-card rounded-lg border border-gem-crystal/30">
                <p className="text-sm text-gray-400">
                  Transaction:
                  {MOCK_MODE ? (
                    <span className="text-gem-crystal ml-2">{txHash} (mock)</span>
                  ) : (
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gem-crystal hover:text-gem-gold ml-2"
                    >
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connect Wallet Prompt */}
        {!wallet.address && (
          <div className="bg-gradient-to-br from-dark-card to-gem-crystal/10 border border-gem-crystal/30 rounded-xl p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to start making on-chain BIZARRE attestations
            </p>
            <p className="text-sm text-gray-500">
              Use the wallet button in the navigation bar to connect
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent">
              Attestation Leaderboard
            </h2>
            <span className="text-sm text-gray-400">Top Attesters</span>
          </div>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 sm:px-4">Rank</th>
                    <th className="text-left py-3 px-2 sm:px-4">User</th>
                    <th className="text-center py-3 px-2 sm:px-4">Total</th>
                    <th className="text-center py-3 px-2 sm:px-4 hidden sm:table-cell">Streak</th>
                    <th className="text-center py-3 px-2 sm:px-4 hidden md:table-cell">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isCurrentUser = entry.wallet_address.toLowerCase() === wallet.address?.toLowerCase();

                    return (
                      <tr
                        key={entry.wallet_address}
                        className={`border-b border-gray-800 hover:bg-dark-panel transition-colors ${
                          isCurrentUser ? 'bg-gem-gold/5' : ''
                        }`}
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <span className={`font-bold ${
                            entry.rank === 1 ? 'text-gem-gold text-lg' :
                            entry.rank === 2 ? 'text-gray-300' :
                            entry.rank === 3 ? 'text-orange-600' :
                            'text-gray-400'
                          }`}>
                            {entry.rank === 1 && '👑 '}
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <div>
                            <p className="font-semibold text-white">
                              {entry.username || 'Anonymous'}
                              {isCurrentUser && ' (You)'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                            </p>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 sm:px-4">
                          <span className="font-bold text-lg">{entry.total_attestations}</span>
                        </td>
                        <td className="text-center py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <span className="font-semibold">
                            {entry.current_streak} {getStreakEmojis(entry.current_streak)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 sm:px-4 hidden md:table-cell">
                          {entry.best_streak}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No attestations yet. Be the first!</p>
              <p className="text-sm">Complete your first attestation to appear on the leaderboard</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-dark-card to-gem-crystal/5 rounded-lg p-4 border border-gem-crystal/20">
            <h3 className="font-bold text-gem-crystal mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              How It Works
            </h3>
            <p className="text-sm text-gray-400">
              Make a daily on-chain attestation declaring "I AM BIZARRE" on Base network.
              Each attestation costs ~{gasEstimate} in gas and contributes to your streak.
            </p>
          </div>

          <div className="bg-gradient-to-br from-dark-card to-gem-gold/5 rounded-lg p-4 border border-gem-gold/20">
            <h3 className="font-bold text-gem-gold mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Build Your Streak
            </h3>
            <p className="text-sm text-gray-400">
              Attest daily to build your streak! 20-hour cooldown between attestations.
              Missing a day resets your current streak but not your total count.
            </p>
          </div>

          <div className="bg-gradient-to-br from-dark-card to-gem-pink/5 rounded-lg p-4 border border-gem-pink/20">
            <h3 className="font-bold text-gem-pink mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Future Rewards
            </h3>
            <p className="text-sm text-gray-400">
              Attestation data is permanently stored on-chain and in our database.
              Future $BB rewards and NFTs will be distributed based on your attestation history!
            </p>
          </div>
        </div>

        {/* Milestones Preview */}
        <div className="mt-8 bg-gradient-to-br from-dark-card to-gem-gold/5 rounded-xl p-6 border border-gem-gold/20">
          <h3 className="text-xl font-bold text-gem-gold mb-4">Milestone Rewards (Coming Soon)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl mb-2">🔥</p>
              <p className="font-bold text-white">7-Day Streak</p>
              <p className="text-sm text-gray-400">Week Warrior Badge</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-2">🔥🔥🔥</p>
              <p className="font-bold text-white">30-Day Streak</p>
              <p className="text-sm text-gray-400">Bizarre Legend NFT</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-2">👹🏆</p>
              <p className="font-bold text-white">100 Attestations</p>
              <p className="text-sm text-gray-400">$BB Token Rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}