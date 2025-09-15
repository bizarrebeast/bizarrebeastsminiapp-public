'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, EMPIRE_TIERS } from '../app/contracts/config';
import BizarreCheckInABI from '../app/contracts/abi/BizarreCheckIn.json';
import RitualGatekeeperABI from '../app/contracts/abi/RitualGatekeeper.json';
import { useWallet } from '@/hooks/useWallet';
import { web3Service } from '@/lib/web3';
import ShareButtons from './ShareButtons';
import { isBetaTester, BETA_PHASE_ACTIVE } from '@/lib/beta-testers';

interface CheckInProps {
  userTier?: keyof typeof EMPIRE_TIERS;
  completedRituals: number;
}

export default function CheckIn({ userTier = 'NORMIE', completedRituals }: CheckInProps) {
  // Use your existing wallet connection
  const wallet = useWallet();

  const [checkInContract, setCheckInContract] = useState<ethers.Contract | null>(null);
  const [gatekeeperContract, setGatekeeperContract] = useState<ethers.Contract | null>(null);

  const [canCheckIn, setCanCheckIn] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [pendingRewards, setPendingRewards] = useState('0');
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showShareAfterCheckIn, setShowShareAfterCheckIn] = useState(false);
  const [showShareAfterClaim, setShowShareAfterClaim] = useState(false);
  const [lastClaimedAmount, setLastClaimedAmount] = useState('');
  const [totalEarned, setTotalEarned] = useState('0');

  // Initialize contracts when wallet connects
  useEffect(() => {
    const initContracts = async () => {
      if (!wallet.isConnected || !wallet.address) {
        setCheckInContract(null);
        setGatekeeperContract(null);
        return;
      }

      try {
        const signer = await web3Service.getSigner();
        if (!signer) {
          console.error('No signer available');
          return;
        }

        // Initialize contracts
        const checkIn = new ethers.Contract(
          CONTRACT_ADDRESSES.bizarreCheckIn,
          BizarreCheckInABI.abi,
          signer
        );

        const gatekeeper = new ethers.Contract(
          CONTRACT_ADDRESSES.ritualGatekeeper,
          RitualGatekeeperABI.abi,
          signer
        );

        setCheckInContract(checkIn);
        setGatekeeperContract(gatekeeper);

      } catch (error) {
        console.error('Contract initialization error:', error);
      }
    };

    initContracts();
  }, [wallet.isConnected, wallet.address]);

  // Check user status
  useEffect(() => {
    const checkStatus = async () => {
      if (!checkInContract || !gatekeeperContract || !wallet.address) {
        return;
      }

      // Check if we're on the right network (Base Mainnet)
      const provider = await web3Service.getProvider();
      if (provider) {
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(8453)) {
          console.log('Wrong network! Current:', network.chainId, 'Expected: 8453 (Base Mainnet)');
          setMessage('⚠️ Please switch to Base network');
          setIsCheckingStatus(false);
          return;
        }
      }

      setIsCheckingStatus(true);

      try {
        // Check if user can check in (ritual requirement)
        const unlocked = await gatekeeperContract.canUserCheckIn(wallet.address);
        console.log('Check-in unlock status for', wallet.address, ':', unlocked);
        setIsUnlocked(unlocked);

        // Get user data
        const userData = await checkInContract.getUserData(wallet.address);
        console.log('User data:', userData);
        console.log('Current streak:', Number(userData.currentStreak));
        setCurrentStreak(Number(userData.currentStreak));
        setPendingRewards(ethers.formatEther(userData.pendingRewards));

        // Check if can check in now
        const canCheck = await checkInContract.canCheckIn(wallet.address);
        setCanCheckIn(canCheck);

        // Calculate time until next check-in
        // If user can't check in and has a streak, they're in cooldown
        if (!canCheck && Number(userData.currentStreak) > 0) {
          // User has checked in, calculate from lastCheckInTime
          // userData[0] is lastCheckInTime as BigInt
          const lastCheckIn = Number(userData[0]);
          const now = Math.floor(Date.now() / 1000);
          const timeSinceLastCheckIn = now - lastCheckIn;
          const cooldownPeriod = 72000; // 20 hours in seconds
          const timeRemaining = Math.max(0, cooldownPeriod - timeSinceLastCheckIn);
          setTimeUntilNext(timeRemaining);
          console.log('Time until next check-in:', timeRemaining, 'seconds');
          console.log('Last check-in was at:', lastCheckIn, 'now is:', now);
        } else {
          setTimeUntilNext(0);
        }

        // Clear any stuck messages
        if (message === 'Check-ins unlocked! Refreshing...') {
          setMessage('');
        }

      } catch (error) {
        console.error('Status check error:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [checkInContract, gatekeeperContract, wallet.address]);

  // Perform check-in
  const handleCheckIn = async () => {
    if (!checkInContract || !wallet.address) return;

    setLoading(true);
    setMessage('');

    try {
      // Use the actual empire tier from wallet, fallback to prop
      const tierToUse = wallet.empireTier ?
        Object.keys(EMPIRE_TIERS).find(tier =>
          EMPIRE_TIERS[tier as keyof typeof EMPIRE_TIERS].name === wallet.empireTier
        ) || userTier : userTier;

      const tx = await checkInContract.checkIn(tierToUse);
      setMessage('Transaction sent! Confirming on blockchain...');

      const receipt = await tx.wait();
      setMessage(`✅ Check-in successful! Streak: ${currentStreak + 1}`);

      // Update local state immediately
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setCanCheckIn(false);
      setTimeUntilNext(72000); // 20 hours in seconds

      // Show share buttons for check-in
      setShowShareAfterCheckIn(true);

      // Don't clear the message or hide share buttons - let user share anytime

    } catch (error: any) {
      console.error('Check-in error:', error);
      if (error.message?.includes('Wait 20 hours')) {
        setMessage('⏰ Already checked in - wait 20 hours for next check-in');
      } else {
        setMessage('❌ ' + (error.message || 'Check-in failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    if (!checkInContract || !wallet.address) return;

    setLoading(true);
    setMessage('');

    try {
      const tx = await checkInContract.claimRewards();
      setMessage('Claiming rewards...');

      await tx.wait();
      setMessage(`✅ Successfully claimed ${pendingRewards} BB!`);

      // Store claim amount for sharing
      setLastClaimedAmount(pendingRewards);
      setTotalEarned(prev => {
        const total = parseFloat(prev) + parseFloat(pendingRewards);
        return total.toLocaleString();
      });

      // Update local state
      setPendingRewards('0');

      // Show share buttons for claim
      setShowShareAfterClaim(true);

      // Don't clear the message or hide share buttons - let user share anytime

    } catch (error: any) {
      console.error('Claim error:', error);
      setMessage('❌ ' + (error.message || 'Claim failed'));
    } finally {
      setLoading(false);
    }
  };

  // Add share for streak break (when user returns with streak = 1 after break)
  useEffect(() => {
    // Store previous streak in localStorage to detect breaks
    const storedStreak = localStorage.getItem(`bb_streak_${wallet.address}`);
    if (storedStreak && currentStreak === 1 && parseInt(storedStreak) > 1) {
      // Streak was broken, offer to share comeback
      const bestStreak = localStorage.getItem(`bb_best_streak_${wallet.address}`) || storedStreak;
      setMessage('🔄 Starting fresh! Your previous streak was ' + storedStreak + ' days.');
      // Could show share button here for streak break
    }

    // Update stored streak
    if (currentStreak > 0) {
      localStorage.setItem(`bb_streak_${wallet.address}`, currentStreak.toString());
      const best = localStorage.getItem(`bb_best_streak_${wallet.address}`) || '0';
      if (currentStreak > parseInt(best)) {
        localStorage.setItem(`bb_best_streak_${wallet.address}`, currentStreak.toString());
      }
    }
  }, [currentStreak, wallet.address]);

  // Handle unlock request
  const handleUnlock = async () => {
    if (!wallet.address || completedRituals < 3) return;

    setLoading(true);
    setMessage('Unlocking check-ins...');

    try {
      const response = await fetch('/api/unlock-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.address,
          ritualsCompleted: completedRituals,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Check-ins unlocked!');
        setIsUnlocked(true); // Update state immediately

        // Force re-check status after a moment
        setTimeout(async () => {
          if (gatekeeperContract && wallet.address) {
            const unlocked = await gatekeeperContract.canUserCheckIn(wallet.address);
            setIsUnlocked(unlocked);
            setMessage('');
          }
        }, 1000);
      } else {
        setMessage('❌ ' + (data.error || 'Failed to unlock'));
      }
    } catch (error) {
      console.error('Unlock error:', error);
      setMessage('❌ Failed to unlock check-ins');
    } finally {
      setLoading(false);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get tier info - use wallet tier if available and capitalize it
  const actualTier = wallet.empireTier || userTier;
  const displayTier = actualTier.toUpperCase();
  const tierInfo = EMPIRE_TIERS[actualTier as keyof typeof EMPIRE_TIERS] || EMPIRE_TIERS.NORMIE;

  // If wallet not connected, show coming soon for beta phase
  if (!wallet.isConnected) {
    return (
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/10 border border-gem-crystal/30 rounded-xl p-8 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-2">
            ☀️ Daily Check-In Rewards
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Build your streak and earn $BB tokens every 5 days!
          </p>
          <div className="bg-dark-bg/50 rounded-lg p-6 mb-4">
            <div className="text-4xl mb-4">🧪</div>
            <p className="text-2xl font-bold text-gem-gold mb-2">
              Coming Soon
            </p>
            <p className="text-gem-crystal/80 text-sm">
              Daily check-ins are currently in beta testing.
              Join our community to be notified when it launches!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (isCheckingStatus && !isUnlocked) {
    return (
      <div className="bg-gradient-to-br from-gem-dark/90 via-black/90 to-gem-purple/20 border border-gem-gold/30 rounded-xl p-8 mt-8 backdrop-blur-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent mb-4">
          ☀️ Daily Check-In System
        </h2>
        <p className="text-gem-crystal animate-pulse">Checking unlock status...</p>
      </div>
    );
  }

  // If not unlocked (less than 3 rituals)
  if (!isUnlocked) {
    return (
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/10 border border-gem-crystal/30 rounded-xl p-8 backdrop-blur-sm">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-2">
            ☀️ Daily Check-In Rewards
          </h2>
          <p className="text-gray-400 text-sm">
            Build your streak and earn $BB tokens every 5 days!
          </p>
        </div>

        <div className="bg-gradient-to-br from-dark-bg/50 to-gem-crystal/5 rounded-lg p-6 mb-6 border border-gem-crystal/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{completedRituals >= 3 ? '🔓' : '🔒'}</div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {completedRituals >= 3 ? 'Ready to Unlock!' : `${3 - completedRituals} More Ritual${3 - completedRituals > 1 ? 's' : ''} Needed`}
                </p>
                <p className="text-sm text-gray-400">
                  {completedRituals}/3 rituals completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                {completedRituals}/3
              </div>
            </div>
          </div>

          <div className="bg-dark-bg/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Requirements:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={completedRituals >= 1 ? 'text-gem-gold' : 'text-gray-500'}>✓</span>
                <span className={`text-sm ${completedRituals >= 1 ? 'text-gray-300' : 'text-gray-500'}`}>
                  Complete 1st ritual
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={completedRituals >= 2 ? 'text-gem-gold' : 'text-gray-500'}>✓</span>
                <span className={`text-sm ${completedRituals >= 2 ? 'text-gray-300' : 'text-gray-500'}`}>
                  Complete 2nd ritual
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={completedRituals >= 3 ? 'text-gem-gold' : 'text-gray-500'}>✓</span>
                <span className={`text-sm ${completedRituals >= 3 ? 'text-gray-300' : 'text-gray-500'}`}>
                  Complete 3rd ritual
                </span>
              </div>
            </div>
          </div>
        </div>

        {completedRituals >= 3 && (
          <div className="bg-gradient-to-r from-gem-gold/20 to-gem-pink/20 rounded-lg p-6">
            <p className="text-gem-gold mb-4 text-lg font-semibold">
              🎉 Congratulations! You've completed 3 rituals!
            </p>
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-gem-gold to-gem-pink text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Unlocking...' : '🔓 Unlock Daily Check-Ins'}
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 text-center text-yellow-400">{message}</p>
        )}
      </div>
    );
  }

  // Check if user is a beta tester (for non-visitors)
  const isNotBetaTester = BETA_PHASE_ACTIVE && wallet.address && !isBetaTester(wallet.address);

  // Show "Coming Soon" for non-beta testers who are connected
  if (isNotBetaTester) {
    return (
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/10 border border-gem-crystal/30 rounded-xl p-8 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-2">
            ☀️ Daily Check-In Rewards
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Build your streak and earn $BB tokens every 5 days!
          </p>
          <div className="bg-dark-bg/50 rounded-lg p-6 mb-4">
            <div className="text-4xl mb-4">🧪</div>
            <p className="text-2xl font-bold text-gem-gold mb-2">
              Beta Access Required
            </p>
            <p className="text-gem-crystal/80 text-sm mb-4">
              You're not on the beta testing list yet.
            </p>
            <p className="text-xs text-gray-400">
              Join our community to be considered for the next wave!
            </p>
          </div>
          <div className="text-xs text-gray-500 text-center mt-4">
            Connected: {wallet.formatAddress(wallet.address)}
            {wallet.empireScore && ` • Empire Score: ${wallet.empireScore}`}
          </div>
        </div>
      </div>
    );
  }

  // Main check-in interface for beta testers
  return (
    <div className="bg-gradient-to-br from-gem-dark/90 via-black/90 to-gem-purple/20 border border-gem-gold/30 rounded-xl p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent">
          ☀️ Daily Check-In {isBetaTester(wallet.address) && <span className="text-sm text-gem-gold ml-2">🧪 Beta Tester</span>}
        </h2>
        <div className="text-sm text-gem-crystal/70">
          Check in daily to earn rewards!
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-black/50 rounded-lg p-4 mb-6 text-sm text-gem-crystal/80">
        <p className="mb-2">📌 <strong>How Check-Ins Work:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Check in once every 20+ hours to maintain your streak</li>
          <li>Earn BB token rewards every 5 days based on your Empire tier</li>
          <li>Miss 44+ hours and your streak resets to 0</li>
          <li>After 30 days, cycle completes and resets</li>
        </ul>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gem-purple/20 to-black/50 p-4 rounded-lg border border-gem-purple/30">
          <p className="text-gray-400 text-sm mb-1">Empire Tier</p>
          <p className="text-xl font-bold text-gem-gold">{displayTier}</p>
          {wallet.empireRank && (
            <p className="text-xs text-gray-500">Rank #{wallet.empireRank}</p>
          )}
        </div>
        <div className="bg-gradient-to-br from-gem-pink/20 to-black/50 p-4 rounded-lg border border-gem-pink/30">
          <p className="text-gray-400 text-sm mb-1">Current Streak</p>
          <p className="text-xl font-bold text-gem-pink">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gem-gold/20 to-black/50 p-4 rounded-lg border border-gem-gold/30">
          <p className="text-gray-400 text-sm mb-1">Pending Rewards</p>
          <p className="text-xl font-bold text-gem-gold">{pendingRewards} BB</p>
        </div>
        <div className="bg-gradient-to-br from-gem-crystal/20 to-black/50 p-4 rounded-lg border border-gem-crystal/30">
          <p className="text-gray-400 text-sm mb-1">Next Check-In</p>
          <p className="text-xl font-bold text-gem-crystal">
            {timeUntilNext > 0 ? formatTimeRemaining(timeUntilNext) : 'Ready!'}
          </p>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="bg-black/50 rounded-lg p-4 mb-6 border border-gem-gold/20">
        <h3 className="text-lg font-bold text-gem-gold mb-3">
          Your Rewards ({displayTier} Tier)
        </h3>
        <div className="space-y-2 text-sm">
          {tierInfo.fiveDayReward ? (
            <>
              <p className="text-gem-crystal">
                ✨ <strong>Every 5 days:</strong> {tierInfo.fiveDayReward}
              </p>
              {tierInfo.fifteenDayBonus && (
                <p className="text-gem-crystal">
                  🏆 <strong>15-day milestone:</strong> {tierInfo.fifteenDayBonus}
                </p>
              )}
              {tierInfo.thirtyDayBonus && (
                <p className="text-gem-crystal">
                  👑 <strong>30-day milestone:</strong> {tierInfo.thirtyDayBonus}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 italic">
              📊 Engagement tracking only (no BB rewards for {displayTier} tier)
            </p>
          )}
        </div>

        {/* Next reward info */}
        {currentStreak > 0 && currentStreak < 30 && (
          <div className="mt-3 pt-3 border-t border-gem-gold/20">
            <p className="text-xs text-gem-crystal/70">
              Next reward in {5 - (currentStreak % 5)} days
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleCheckIn}
          disabled={!canCheckIn || loading}
          className={`flex-1 px-6 py-4 font-bold rounded-lg transition-all ${
            canCheckIn
              ? 'bg-gradient-to-r from-gem-gold to-gem-pink text-black hover:opacity-90'
              : 'bg-gray-800 text-gray-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {loading ? 'Processing...' :
           canCheckIn ? '✅ Check In Now!' :
           `⏰ Wait ${formatTimeRemaining(timeUntilNext)}`}
        </button>

        {parseFloat(pendingRewards) > 0 && (
          <button
            onClick={handleClaimRewards}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            💰 Claim {pendingRewards} BB
          </button>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.includes('✅') ? 'bg-green-500/20 border border-green-500/30' :
          message.includes('❌') ? 'bg-red-500/20 text-red-400' :
          message.includes('⏰') ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-gem-crystal/20 text-gem-crystal'
        }`}>
          <div className={`text-center ${
            message.includes('✅') ? 'text-green-400' : ''
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Share buttons - show after check-in or when in cooldown with a streak */}
      {(() => {
        const shouldShow = showShareAfterCheckIn || (currentStreak > 0 && timeUntilNext > 0);
        console.log('Share button condition:', {
          showShareAfterCheckIn,
          currentStreak,
          timeUntilNext,
          shouldShow
        });
        return shouldShow;
      })() && (
        <div className="p-4 rounded-lg mb-4 bg-gem-crystal/10 border border-gem-gold/20">
          <div className="flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-2">Share your streak:</p>
              <ShareButtons
                shareType={
                  currentStreak === 5 ? 'milestone5' :
                  currentStreak === 15 ? 'milestone15' :
                  currentStreak === 30 ? 'milestone30' :
                  'checkin'
                }
                checkInData={{
                  streak: currentStreak,
                  tierReward: tierInfo.fiveDayReward?.replace(' BB', 'k') || '0',
                  streakMessage:
                    currentStreak === 5 ? '💰 5-day reward earned!' :
                    currentStreak === 15 ? '🎉 15-day bonus unlocked!' :
                    currentStreak === 30 ? '👑 30-day cycle complete! Maximum rewards earned!' :
                    currentStreak % 5 === 0 ? '💰 5-day reward earned!' :
                    'Building my empire, one day at a time!'
                }}
                milestoneData={{
                  reward: currentStreak === 5 ? tierInfo.fiveDayReward : undefined,
                  bonus: currentStreak === 15 ? tierInfo.fifteenDayBonus : undefined,
                  totalRewards: currentStreak === 30 ?
                    `${(parseFloat(tierInfo.fiveDayReward?.replace(/[^0-9]/g, '') || '0') * 6 +
                       parseFloat(tierInfo.fifteenDayBonus?.replace(/[^0-9]/g, '') || '0') +
                       parseFloat(tierInfo.thirtyDayBonus?.replace(/[^0-9]/g, '') || '0')).toLocaleString()}` : undefined
                }}
                contextUrl="https://bbapp.bizarrebeasts.io/rituals"
              />
            </div>
        </div>
      )}

      {/* Share buttons after claiming rewards */}
      {showShareAfterClaim && (
        <div className="p-4 rounded-lg mb-4 bg-gem-crystal/10 border border-gem-gold/20">
            <div className="mt-4 flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-2">Share your rewards:</p>
              <ShareButtons
                shareType="claim"
                claimData={{
                  amount: lastClaimedAmount.replace(' BB', '').replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                  totalEarned: totalEarned,
                  tierMessage:
                    displayTier === 'BIZARRE' ? '👑 BIZARRE tier = Maximum rewards!' :
                    displayTier === 'WEIRDO' ? '🏆 WEIRDO tier = Solid rewards!' :
                    displayTier === 'ODDBALL' ? '⭐ ODDBALL tier = Growing strong!' :
                    displayTier === 'MISFIT' ? '✨ MISFIT tier = Just getting started!' :
                    '😐 NORMIE tier = Keep building!'
                }}
                contextUrl="https://bbapp.bizarrebeasts.io/rituals"
              />
            </div>
        </div>
      )}

      {/* Share button for streak break comeback */}
      {message.includes('🔄') && message.includes('Starting fresh') && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2">Share your comeback:</p>
          <ShareButtons
            shareType="streakbreak"
            milestoneData={{
              bestStreak: parseInt(localStorage.getItem(`bb_best_streak_${wallet.address}`) || '0')
            }}
            contextUrl="https://bbapp.bizarrebeasts.io/rituals"
          />
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Connected: {wallet.formatAddress(wallet.address)}
        {wallet.empireScore && ` • Empire Score: ${wallet.empireScore}`}
      </div>
    </div>
  );
}