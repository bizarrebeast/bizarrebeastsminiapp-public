'use client';

import { useState, useEffect, useRef } from 'react';
import { Coins, Trophy, Info } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import ShareButtons from '@/components/ShareButtons';
import { isBetaTester } from '@/lib/beta-testers';
import posthog from 'posthog-js';
import confetti from 'canvas-confetti';

type GameState = 'idle' | 'flipping' | 'result';
type Choice = 'heads' | 'tails';

interface FlipStatus {
  canFlip: boolean;
  dailyFlipUsed: boolean;
  hasBonusSpins: boolean;
  bonusSpinsRemaining: number;
  bonusSpinReason: string | null;
  nextFlipTime: string;
  myEntries: number;
  // Tier-based fields
  userTier?: string;
  empireRank?: number | null;
  maxDailyFlips?: number;
  flipsUsedToday?: number;
  flipsRemaining?: number;
  reason?: string;
}

interface MonthlyPrize {
  name: string;
  description: string;
  imageUrl: string;
  value: string;
  drawingDate: string;
  totalEntries: number;
  totalParticipants: number;
}

interface Balance {
  totalWonBB: string;
  totalWithdrawnBB: string;
  pendingBalanceBB: string;
  canWithdraw: boolean;
  minWithdrawalBB: string;
}

interface Withdrawal {
  id: string;
  amountBB: string;
  status: string;
  txHash: string | null;
  requestedAt: string;
}

export default function FlipClient() {
  const { address } = useWallet();
  const { farcasterFid, farcasterUsername } = useUnifiedAuthStore();
  const isBeta = true; // Open beta - test tokens only

  const [gameState, setGameState] = useState<GameState>('idle');
  const [choice, setChoice] = useState<Choice>('heads');
  const [status, setStatus] = useState<FlipStatus | null>(null);
  const [monthlyPrize, setMonthlyPrize] = useState<MonthlyPrize | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeUntilNextFlip, setTimeUntilNextFlip] = useState('');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const coinDisplayRef = useRef<HTMLDivElement>(null);

  // Load status and prize on mount
  useEffect(() => {
    if (address || farcasterFid) {
      loadStatus();
      loadMonthlyPrize();
      if (address) {
        loadBalance();
      }
    } else {
      setLoading(false);
    }
  }, [address, farcasterFid]);

  // Periodically refresh monthly prize data to show live entry counts
  useEffect(() => {
    if (!address && !farcasterFid) return;

    const interval = setInterval(() => {
      loadMonthlyPrize();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [address, farcasterFid]);

  // Countdown timer
  useEffect(() => {
    if (!status?.nextFlipTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const next = new Date(status.nextFlipTime).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeUntilNextFlip('Ready!');
        loadStatus(); // Refresh status
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilNextFlip(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.nextFlipTime]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/flip/daily-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          farcasterFid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyPrize = async () => {
    try {
      const response = await fetch('/api/flip/monthly-prize');
      if (response.ok) {
        const data = await response.json();
        if (data.hasPrize) {
          setMonthlyPrize({
            ...data.prize,
            totalEntries: data.stats.totalEntries,
            totalParticipants: data.stats.totalParticipants
          });
        }
      }
    } catch (err) {
      console.error('Failed to load monthly prize:', err);
    }
  };

  const loadBalance = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/flip/withdraw?wallet=${address}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !balance?.canWithdraw) return;

    setIsWithdrawing(true);
    setError(null);

    try {
      const response = await fetch('/api/flip/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request withdrawal');
      }

      // Track withdrawal
      if (typeof window !== 'undefined' && posthog) {
        posthog.capture('flip_withdrawal_requested', {
          wallet: address,
          amount: data.withdrawal.amountBB
        });
      }

      // Reload balance
      await loadBalance();

      alert(data.message);

    } catch (err: any) {
      setError(err.message || 'Failed to request withdrawal');
      console.error('Withdrawal error:', err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleFlip = async () => {
    if (!address && !farcasterFid) {
      setError('Please connect wallet or Farcaster');
      return;
    }

    if (!status?.canFlip) {
      setError('No flips available');
      return;
    }

    // Track flip attempt
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('daily_flip_attempt', {
        wallet: address,
        fid: farcasterFid,
        choice,
        hasBonusSpins: status.hasBonusSpins
      });
    }

    setError(null);
    setGameState('flipping');
    setIsFlipping(true);

    try {
      const response = await fetch('/api/flip/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          farcasterFid,
          farcasterUsername,
          choice
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to flip');
      }

      const flipResult = await response.json();
      setResult(flipResult);

      // Track result
      if (typeof window !== 'undefined' && posthog) {
        posthog.capture('daily_flip_result', {
          wallet: address,
          isWinner: flipResult.isWinner,
          isBonusFlip: flipResult.isBonusFlip,
          totalEntries: flipResult.totalEntries
        });
      }

      // Scroll to coin
      if (coinDisplayRef.current) {
        coinDisplayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      // Wait for animation
      setTimeout(async () => {
        setGameState('result');
        setIsFlipping(false);

        // Confetti if won
        if (flipResult.isWinner) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#44D0A7', '#FFD700', '#FF69B4']
          });
        }

        // Reload status
        await loadStatus();
        await loadMonthlyPrize();
        if (address) {
          await loadBalance();
        }
      }, 1000); // Shortened from 2000ms for faster results

    } catch (err: any) {
      setError(err.message || 'Failed to flip');
      setGameState('idle');
      setIsFlipping(false);

      if (typeof window !== 'undefined' && posthog) {
        posthog.capture('daily_flip_error', {
          wallet: address,
          error: err.message
        });
      }
    }
  };

  const handlePlayAgain = () => {
    setGameState('idle');
    setResult(null);
    setError(null);
  };

  if (!isBeta) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🪙</div>
            <h1 className="text-4xl font-bold mb-4">Daily Flip Coming Soon!</h1>
            <p className="text-xl text-gray-400 mb-6">Currently in beta testing</p>
            <p className="text-sm text-gray-500">Follow @bizarrebeasts_ for launch announcement</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-6 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            BizBe's Daily Coin Toss
          </h1>
          <p className="text-xl text-gem-crystal/80">
            Flip daily to win 5,000 $BB + enter monthly drawing!
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-300">
              🧪 <strong>Beta Testing:</strong> Using test tokens on Base Sepolia. Monthly prize is real!
            </p>
          </div>
        </div>

        {/* Monthly Prize Banner */}
        {monthlyPrize && (
          <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-gem-pink/20 to-gem-crystal/20 border-2 border-gem-pink rounded-xl p-6">
            <div className="flex items-start gap-4">
              {monthlyPrize.imageUrl && (
                <img
                  src={monthlyPrize.imageUrl}
                  alt={monthlyPrize.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm text-gem-pink font-semibold">
                    🎁 THIS MONTH'S PRIZE
                  </div>
                  <div className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-300 font-semibold">
                    REAL PRIZE
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{monthlyPrize.name}</h3>
                {monthlyPrize.description && (
                  <p className="text-gray-300 text-sm mb-2">
                    {monthlyPrize.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-gem-gold">{monthlyPrize.value}</span>
                  <span className="text-gray-400">•</span>
                  <span>Drawing: {new Date(monthlyPrize.drawingDate).toLocaleDateString()}</span>
                  <span className="text-gray-400">•</span>
                  <span>{monthlyPrize.totalEntries.toLocaleString()} total entries</span>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-4 pt-4 border-t border-gem-pink/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-gem-crystal font-semibold">
                  💬 Tell friends about this prize:
                </span>
                <ShareButtons
                  shareType="flipPrize"
                  flipPrizeData={{
                    prizeName: monthlyPrize.name,
                    prizeValue: monthlyPrize.value,
                    drawingDate: new Date(monthlyPrize.drawingDate).toLocaleDateString(),
                    totalEntries: monthlyPrize.totalEntries
                  }}
                  contextUrl="https://bbapp.bizarrebeasts.io/flip"
                  buttonSize="md"
                  showLabels={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Compact Status Bar */}
        {status && (
          <div className="max-w-2xl mx-auto mb-6 bg-dark-card border border-gem-crystal/20 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* My Entries */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎟️</div>
                <div>
                  <div className="text-xs text-gray-400">Your Entries</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    {status.myEntries}
                    {monthlyPrize && status.myEntries > 0 && (
                      <span className="text-xs text-gray-400 ml-2 font-normal">
                        ({((status.myEntries / monthlyPrize.totalEntries) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Flips */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">🪙</div>
                <div>
                  <div className="text-xs text-gray-400">
                    Daily Flips
                    {status.userTier && status.userTier !== 'NORMIE' && status.userTier !== 'MISFIT' && (
                      <span className="ml-1 text-gem-crystal">({status.userTier})</span>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gem-crystal">
                    {status.flipsRemaining || 0} left
                  </div>
                  <div className="text-xs text-gray-400">
                    {status.flipsUsedToday || 0}/{status.maxDailyFlips || 1} used
                  </div>
                </div>
              </div>

              {/* Bonus Spins */}
              {status.hasBonusSpins && (
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <div className="text-xs text-gray-400">Bonus Spins</div>
                    <div className="text-xl font-bold text-gem-gold">
                      {status.bonusSpinsRemaining}
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className={`flex items-center gap-3 ${!status.hasBonusSpins ? 'md:col-start-4' : ''}`}>
                <div className="text-2xl">{status.canFlip ? '✅' : '⏰'}</div>
                <div>
                  <div className="text-xs text-gray-400">Status</div>
                  <div className={`text-lg font-bold ${status.canFlip ? 'text-green-400' : 'text-gray-400'}`}>
                    {status.canFlip ? 'Ready!' : timeUntilNextFlip}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Balance & Withdrawal */}
        {balance && address && parseFloat(balance.pendingBalanceBB) > 0 && (
          <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-gem-gold/10 to-gem-crystal/10 border-2 border-gem-gold/50 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💰</div>
                <div>
                  <div className="text-xs text-gray-400">Test Token Balance</div>
                  <div className="text-2xl font-bold text-gem-gold">
                    {parseFloat(balance.pendingBalanceBB).toLocaleString()} $BB
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total won: {parseFloat(balance.totalWonBB).toLocaleString()} $BB
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="px-6 py-3 bg-gray-700/50 text-gray-400 rounded-lg border-2 border-gray-600/50">
                  <div className="text-sm font-semibold">Withdrawals</div>
                  <div className="text-xs mt-1">Coming Soon</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-500/30 bg-yellow-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
              <p className="text-xs text-yellow-300/90 text-center">
                ⚠️ <strong>Beta Test:</strong> These are test tokens with no real value. Balances will be reset before mainnet launch.
              </p>
            </div>
          </div>
        )}

        {/* Main Game Area */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/10 border border-gem-gold/30 rounded-2xl p-6 sm:p-8">

            {/* Coin Display */}
            <div ref={coinDisplayRef} className="flex items-center justify-center mb-6 h-52" style={{ perspective: '1000px' }}>
              {isFlipping ? (
                <div
                  className="relative w-48 h-48"
                  style={{
                    transformStyle: 'preserve-3d',
                    animation: `flipCoin 2s ease-out forwards`,
                    '--final-rotation': result?.result === 'tails' ? '1980deg' : '1800deg'
                  } as React.CSSProperties}
                >
                  <img
                    src="/assets/page-assets/coin/bizbe-gold-coin-heads.svg"
                    alt="Heads"
                    className="absolute inset-0 w-48 h-48"
                    style={{ backfaceVisibility: 'hidden' }}
                  />
                  <img
                    src="/assets/page-assets/coin/bizbe-gold-coin-tails.svg"
                    alt="Tails"
                    className="absolute inset-0 w-48 h-48"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                  />
                </div>
              ) : result ? (
                <div className="text-center">
                  <img
                    src={result.result === 'heads'
                      ? '/assets/page-assets/coin/bizbe-gold-coin-heads.svg'
                      : '/assets/page-assets/coin/bizbe-gold-coin-tails.svg'
                    }
                    alt={result.result}
                    className="w-48 h-48 mx-auto mb-4"
                  />
                  <div className="text-3xl font-bold">
                    {result.result === 'heads' ? "HEADS!" : "TAILS!"}
                  </div>
                </div>
              ) : (
                <img
                  src={choice === 'heads'
                    ? '/assets/page-assets/coin/bizbe-gold-coin-heads.svg'
                    : '/assets/page-assets/coin/bizbe-gold-coin-tails.svg'
                  }
                  alt={choice}
                  className="w-48 h-48"
                />
              )}
            </div>

            {/* Game Controls */}
            {gameState === 'idle' && (
              <div className="space-y-6">
                {/* Choice Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Pick Your Side:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setChoice('heads')}
                      disabled={!status?.canFlip}
                      className={`relative p-5 rounded-xl font-bold text-xl transition-all ${
                        choice === 'heads' ? 'scale-105' : ''
                      } ${!status?.canFlip ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {choice === 'heads' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded-xl" />
                          <div className="absolute inset-[2px] bg-dark-card rounded-xl" />
                        </>
                      )}
                      {choice !== 'heads' && (
                        <div className="absolute inset-0 border border-gem-crystal/30 rounded-xl" />
                      )}
                      <div className={`relative flex flex-col items-center gap-2 ${
                        choice === 'heads'
                          ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent'
                          : 'text-white'
                      }`}>
                        <img
                          src="/assets/page-assets/coin/bizbe-gold-coin-heads.svg"
                          alt="Heads"
                          className="w-16 h-16"
                        />
                        HEADS
                        <span className="text-sm font-normal">(BizBe's Face)</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setChoice('tails')}
                      disabled={!status?.canFlip}
                      className={`relative p-5 rounded-xl font-bold text-xl transition-all ${
                        choice === 'tails' ? 'scale-105' : ''
                      } ${!status?.canFlip ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {choice === 'tails' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded-xl" />
                          <div className="absolute inset-[2px] bg-dark-card rounded-xl" />
                        </>
                      )}
                      {choice !== 'tails' && (
                        <div className="absolute inset-0 border border-gem-crystal/30 rounded-xl" />
                      )}
                      <div className={`relative flex flex-col items-center gap-2 ${
                        choice === 'tails'
                          ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent'
                          : 'text-white'
                      }`}>
                        <img
                          src="/assets/page-assets/coin/bizbe-gold-coin-tails.svg"
                          alt="Tails"
                          className="w-16 h-16"
                        />
                        TAILS
                        <span className="text-sm font-normal">(BizBe's Butt)</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Flip Button */}
                <button
                  onClick={handleFlip}
                  disabled={!status?.canFlip || loading}
                  className="relative w-full py-6 px-8 rounded-xl font-bold text-2xl transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 overflow-hidden"
                >
                  <div className={`absolute inset-0 rounded-xl ${
                    !status?.canFlip || loading
                      ? 'bg-gray-600'
                      : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink'
                  }`} />
                  <div className={`absolute inset-[2px] rounded-xl ${
                    !status?.canFlip || loading
                      ? 'bg-gray-700'
                      : 'bg-dark-card'
                  }`} />
                  <div className={`relative ${
                    !status?.canFlip || loading
                      ? 'text-gray-400'
                      : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent'
                  }`}>
                    {loading ? 'Loading...' :
                     !status?.canFlip ? timeUntilNextFlip :
                     'FLIP NOW!'}
                  </div>
                </button>

                {!status?.canFlip && status?.dailyFlipUsed && !status?.hasBonusSpins && (
                  <div className="text-center p-6 bg-dark-panel rounded-xl">
                    <div className="text-4xl mb-3">⏰</div>
                    <h3 className="text-xl font-bold mb-2">Come back tomorrow!</h3>
                    <p className="text-gray-400 text-sm">Your free daily flip resets in {timeUntilNextFlip}</p>
                  </div>
                )}
              </div>
            )}

            {/* Result Display */}
            {gameState === 'result' && result && (
              <div className="space-y-6">
                <div className={`text-center p-8 rounded-xl ${
                  result.isWinner ? 'bg-gem-crystal/10 border-2 border-gem-crystal' : 'bg-gem-pink/10 border-2 border-gem-pink/30'
                }`}>
                  <div className="text-5xl font-bold mb-4">
                    {result.isWinner ? '🎉 YOU WIN! 🎉' : '😢 Not Today!'}
                  </div>
                  {result.isWinner && (
                    <div className="text-3xl text-gem-gold mb-2">
                      +5,000 $BB
                    </div>
                  )}
                </div>

                {/* Entry Notification */}
                <div className="bg-gem-gold/10 border border-gem-gold rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎟️</span>
                    <div>
                      <div className="font-semibold text-gem-gold">+1 Entry to Monthly Drawing!</div>
                      <div className="text-sm text-gray-300">
                        You now have {result.totalEntries} {result.totalEntries === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share */}
                {result.isWinner && monthlyPrize && (
                  <div className="bg-dark-panel border border-gem-crystal/30 rounded-xl p-4">
                    <div className="text-center mb-3 font-semibold text-gem-crystal">Share your win!</div>
                    <ShareButtons
                      shareType="flipWin"
                      flipPrizeData={{
                        prizeName: monthlyPrize.name,
                        prizeValue: monthlyPrize.value,
                        drawingDate: new Date(monthlyPrize.drawingDate).toLocaleDateString(),
                        totalEntries: result.totalEntries
                      }}
                      contextUrl="https://bbapp.bizarrebeasts.io/flip"
                      buttonSize="md"
                      showLabels={false}
                    />
                  </div>
                )}

                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink font-bold text-xl text-black"
                >
                  {status?.canFlip ? 'Flip Again' : 'Done'}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-gem-pink/10 border-2 border-gem-pink rounded-xl">
                <div className="text-gem-pink font-semibold">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="max-w-2xl mx-auto mt-6 space-y-4">
          <div className="bg-dark-card rounded-xl p-6 border border-gem-crystal/30">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-gem-crystal" /> How It Works
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. Pick heads or tails</p>
              <p>2. Flip daily for free (1-5 times based on Empire tier)</p>
              <p>3. Win 5,000 test $BB instantly (50/50 chance)</p>
              <p>4. Each flip = 1 entry into monthly prize drawing</p>
              <p>5. Accumulate test tokens during beta (withdrawals coming soon)</p>
              <p className="text-gem-gold font-semibold pt-2">
                🎁 {monthlyPrize ? `This month's REAL prize: ${monthlyPrize.name}` : 'Monthly prizes announced soon!'}
              </p>
            </div>
          </div>

          {/* Tier Rewards */}
          <div className="bg-dark-card rounded-xl p-6 border border-gem-crystal/30">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gem-gold" /> Empire Tier Rewards
            </h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${status?.userTier === 'BIZARRE' ? 'bg-gem-pink/10 border-gem-pink' : 'bg-dark-panel border-gem-crystal/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <span className="font-bold text-gem-pink">BIZARRE</span>
                  </div>
                  <span className="text-gem-crystal font-bold">5 flips/day</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${status?.userTier === 'WEIRDO' ? 'bg-gem-crystal/10 border-gem-crystal' : 'bg-dark-panel border-gem-crystal/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💎</span>
                    <span className="font-bold text-gem-crystal">WEIRDO</span>
                  </div>
                  <span className="text-gem-crystal font-bold">3 flips/day</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${status?.userTier === 'ODDBALL' ? 'bg-gem-gold/10 border-gem-gold' : 'bg-dark-panel border-gem-crystal/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span className="font-bold text-gem-gold">ODDBALL</span>
                  </div>
                  <span className="text-gem-crystal font-bold">2 flips/day</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${status?.userTier === 'MISFIT' || status?.userTier === 'NORMIE' || !status?.userTier ? 'bg-gray-500/10 border-gray-500' : 'bg-dark-panel border-gem-crystal/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪙</span>
                    <span className="font-bold text-gray-300">Everyone Else</span>
                  </div>
                  <span className="text-gem-crystal font-bold">1 flip/day</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gem-crystal/20 text-xs text-gray-400 text-center">
              <p>Tier based on Empire holdings • Resets daily at midnight UTC</p>
              <p className="mt-1">Bonus spins stack with tier flips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flip animation CSS */}
      <style jsx>{`
        @keyframes flipCoin {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(var(--final-rotation));
          }
        }
      `}</style>
    </div>
  );
}
