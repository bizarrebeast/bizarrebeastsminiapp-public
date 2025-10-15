'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { web3Service } from '@/lib/web3';
import { getUnifiedProvider, isOnBaseNetwork, getUnifiedSigner } from '@/lib/unified-provider';
import Image from 'next/image';
import { Trophy, Flame, TrendingUp, Share2, CheckCircle, Zap, Clock, AlertCircle, ArrowLeft, Info } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import AttestationCooldown from '@/components/AttestationCooldown';
import { ethers } from 'ethers';
import ATTESTATION_ABI from '@/lib/contracts/attestation-abi.json';
import { ATTESTATION_CONFIG_TESTNET } from '@/lib/contracts/attestation-config-testnet';
import { ATTESTATION_CONFIG_MAINNET } from '@/lib/contracts/attestation-config-mainnet';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { isBetaTester } from '@/lib/beta-testers';
import { sdk } from '@/lib/sdk-init';

// Configuration
const MOCK_MODE = false; // Contract is deployed!
const TESTNET_MODE = false; // LIVE ON BASE MAINNET!
const NETWORK_NAME = TESTNET_MODE ? 'Base Sepolia' : 'Base';
const CONTRACT_ADDRESS = TESTNET_MODE ? ATTESTATION_CONFIG_TESTNET.contractAddress : ATTESTATION_CONFIG_MAINNET.contractAddress;
const CHAIN_ID = TESTNET_MODE ? ATTESTATION_CONFIG_TESTNET.chainId : ATTESTATION_CONFIG_MAINNET.chainId;

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
  const wallet = useWallet();
  const { farcasterUsername, farcasterFid } = useUnifiedAuthStore();
  const isBeta = isBetaTester(wallet.address);
  const [userStats, setUserStats] = useState<AttestationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isAttesting, setIsAttesting] = useState(false);
  const [attestationComplete, setAttestationComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gasEstimate] = useState<string>('~$0.01');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastAttestationTime, setLastAttestationTime] = useState<string | null>(null);
  const [showBetaInfo, setShowBetaInfo] = useState(false);

  // Helper function to check if cooldown has expired (20 hours)
  const isCooldownExpired = (): boolean => {
    if (!lastAttestationTime) return true;

    const lastTime = new Date(lastAttestationTime).getTime();
    const now = Date.now();
    const cooldownPeriod = 20 * 60 * 60 * 1000; // 20 hours in milliseconds

    return (now - lastTime) >= cooldownPeriod;
  };

  useEffect(() => {
    // Load last attestation time from localStorage
    const storedTime = localStorage.getItem('lastAttestationTime');
    setLastAttestationTime(storedTime);

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

      // Check if attestation cooldown is active (less than 20 hours since last attestation)
      // If cooldown hasn't expired, mark as complete
      if (!isCooldownExpired()) {
        setAttestationComplete(true);
      } else {
        setAttestationComplete(false);
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
    // For ritual 10, show personal cooldown, not UTC reset
    const lastAttestationStr = localStorage.getItem('lastAttestationTime');

    if (!lastAttestationStr) {
      // No previous attestation
      setTimeUntilReset('Ready to prove!');
      return;
    }

    const lastAttestation = new Date(lastAttestationStr);
    const now = new Date();
    const nextAvailable = new Date(lastAttestation.getTime() + (20 * 60 * 60 * 1000)); // 20 hours after last

    if (now >= nextAvailable) {
      setTimeUntilReset('Ready to prove!');
    } else {
      const diff = nextAvailable.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m until you can prove again`);
      } else {
        setTimeUntilReset(`${minutes}m until you can prove again`);
      }
    }
  };

  const handleProve = async () => {
    if (!wallet.address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsAttesting(true);
    setError('');

    // Variable to store blockchain timestamp across nested blocks
    let blockTimestamp = new Date().toISOString();

    try {
      if (MOCK_MODE) {
        // Mock proof for testing
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
        // Real contract interaction
        console.log('Using real contract on', NETWORK_NAME);
        console.log('Contract address:', CONTRACT_ADDRESS);
        console.log('Target Chain ID:', CHAIN_ID);

        // Check if we're in Farcaster miniapp FIRST
        const inMiniapp = await sdk.isInMiniApp();
        console.log('📱 In Farcaster miniapp:', inMiniapp);

        // Get the unified provider (works for both Farcaster and web3)
        let provider = await getUnifiedProvider();
        if (!provider) {
          throw new Error('No wallet provider found. Please connect your wallet.');
        }

        // Check and switch to correct network
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);

        console.log('Current Chain ID:', currentChainId);

        if (currentChainId !== CHAIN_ID) {
          console.log(`⚠️ Wrong network! Need to switch to ${NETWORK_NAME}...`);

          if (inMiniapp) {
            // In Farcaster, wallet should already be on Base - this shouldn't happen
            console.error('⚠️ Farcaster wallet not on Base - this is unexpected');
            throw new Error(`Your Farcaster wallet is on the wrong network (chain ${currentChainId}). Please switch to Base (chain 8453) in your wallet settings.`);
          }

          try {
            // For browser wallets, use window.ethereum for network switching
            if (window.ethereum) {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
              });
            } else {
              throw new Error('Cannot switch network - wallet provider not available');
            }
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Add the network
              const networkParams = TESTNET_MODE ? {
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              } : {
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              };

              if (window.ethereum) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [networkParams],
                });
              }
            } else {
              throw switchError;
            }
          }

          // Re-get provider after network switch
          const newProvider = await getUnifiedProvider();
          if (newProvider) {
            provider = newProvider;
          }
        }

        // Create contract instance using the unified signer
        const signer = await getUnifiedSigner();
        if (!signer) {
          throw new Error('Could not get signer from wallet');
        }
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ATTESTATION_ABI, signer);

        // Call attestBizarre function
        console.log('Calling attestBizarre...');
        const tx = await contract.attestBizarre();
        setTxHash(tx.hash);
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation with timeout
        console.log('Waiting for confirmation...');
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Transaction timeout - check block explorer')), 60000)
          )
        ]);
        console.log('Transaction confirmed!', receipt);

        // Get the block timestamp from the blockchain immediately after confirmation
        const txProvider = await getUnifiedProvider();

        if (txProvider && receipt) {
          const block = await txProvider.getBlock(receipt.blockNumber);
          if (block) {
            blockTimestamp = new Date(block.timestamp * 1000).toISOString();
            console.log('📅 Block timestamp from blockchain:', blockTimestamp);
          }
        }

        setAttestationComplete(true);

        // Save to localStorage with blockchain timestamp
        const attestationData = {
          wallet: wallet.address,
          timestamp: blockTimestamp,
          txHash: tx.hash,
          network: NETWORK_NAME,
          contractAddress: CONTRACT_ADDRESS
        };
        localStorage.setItem('bizarreAttestation', JSON.stringify(attestationData));
        localStorage.setItem('lastAttestationTime', blockTimestamp);
        setLastAttestationTime(blockTimestamp);

        // Try to record in database (optional - won't break if it fails)
        try {
          console.log('📅 Recording with block timestamp:', blockTimestamp);

          await fetch('/api/attestations/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: wallet.address,
              txHash: tx.hash,
              blockNumber: receipt.blockNumber,
              blockTimestamp: blockTimestamp, // Send actual blockchain timestamp
              gasUsed: receipt.gasUsed.toString(),
              network: NETWORK_NAME,
              username: farcasterUsername,
              fid: farcasterFid
            })
          });
          console.log('📝 Recorded attestation with username:', farcasterUsername, 'at', blockTimestamp);
        } catch (dbError) {
          console.log('Could not save to database, but attestation succeeded:', dbError);
        }
      }

      // Mark ritual as complete - use ISO date format for consistency
      const today = new Date().toISOString().split('T')[0];
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

        // Also record to database for cross-device sync with blockchain timestamp
        try {
          // Import authenticatedFetch for proper auth handling
          const { authenticatedFetch } = await import('@/lib/auth-slay-approach');
          await authenticatedFetch('/api/rituals/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ritualId: 10,
              walletAddress: wallet.address,
              fid: farcasterFid,
              blockTimestamp: blockTimestamp // Send blockchain timestamp
            })
          });
          console.log('✅ Attestation saved to database as ritual 10 at', blockTimestamp);
        } catch (error) {
          console.error('Failed to save ritual completion to database:', error);
        }
      }

      // Store the attestation timestamp
      const attestTime = new Date().toISOString();
      localStorage.setItem('lastAttestationTime', attestTime);
      setLastAttestationTime(attestTime);

      // Broadcast ritual completion event for other tabs/components
      window.dispatchEvent(new CustomEvent('ritualCompleted', {
        detail: { ritualId: 10 }
      }));

      // Reload stats
      await loadData();
    } catch (error: any) {
      console.error('Proof failed:', error);

      // Parse error for user-friendly message
      let userMessage = 'Proof failed. Please try again.';
      let technicalDetails = error.message;

      // Check for various cooldown/revert indicators
      if (error.message?.includes('Cooldown period not met') ||
          error.message?.includes('missing revert data') ||
          error.message?.includes('CALL_EXCEPTION')) {
        // This is likely a cooldown error from the contract
        const lastTime = localStorage.getItem('lastAttestationTime');
        if (lastTime) {
          const nextAvailable = new Date(new Date(lastTime).getTime() + (20 * 60 * 60 * 1000));
          const hoursLeft = Math.ceil((nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60));
          userMessage = `⏰ Cooldown Active: You can prove again in approximately ${hoursLeft} hours.`;
        } else {
          userMessage = `⏰ Cooldown Active: Each wallet can only prove once every 20 hours.`;
        }
      } else if (error.message?.includes('user rejected')) {
        userMessage = '❌ Transaction cancelled.';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage = `💸 Insufficient gas. Please add ${TESTNET_MODE ? 'Base Sepolia' : 'Base'} ETH to your wallet.`;
      } else if (error.code === 'NETWORK_ERROR') {
        userMessage = '🌐 Network error. Please check your connection and try again.';
      } else if (error.message?.includes('execution reverted')) {
        // Extract the revert reason if available
        const match = error.message.match(/reason="([^"]+)"/);
        if (match) {
          userMessage = `⚠️ ${match[1]}`;
        }
      }

      // Store technical details for advanced users
      if (technicalDetails && technicalDetails.length > 200) {
        localStorage.setItem('lastErrorDetails', technicalDetails);
        setError(`${userMessage}\n\n[Show technical details]`);
      } else {
        setError(userMessage);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gem-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proof data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section with Banner */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden">
        <Image
          src="/assets/page-assets/banners/rituals-boxes/bizarre-attest-ritual-banner.png"
          alt="Prove It"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />

        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => window.location.href = '/rituals'}
            className="flex items-center gap-2 px-4 py-2 bg-dark-bg/90 backdrop-blur-sm rounded-lg border border-gem-crystal/30 hover:border-gem-crystal/50 hover:bg-dark-panel/90 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-gem-crystal" />
            <span className="text-gem-crystal">Back to Rituals</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Beta Gate for Non-Beta Users */}
          {!isBeta && wallet.address && (
            <div className="max-w-2xl mx-auto mb-8 p-8 bg-dark-card border border-gem-gold/30 rounded-xl text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                Coming Soon!
              </h2>
              <p className="text-gem-crystal/60 mb-4">
                The Prove It ritual is currently in closed beta testing.
              </p>
              <p className="text-sm text-gem-crystal/40">
                Follow @bizarrebeasts_ on Farcaster for launch announcements!
              </p>
            </div>
          )}

          {/* Header */}
          {isBeta && (
            <div className="text-center mb-4">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowBetaInfo(!showBetaInfo)}
                  className="px-4 py-2 bg-gem-crystal/10 border border-gem-crystal/30 rounded-full hover:bg-gem-crystal/20 transition-all flex items-center gap-2"
                >
                  <span className="text-gem-crystal font-semibold">🧪 Beta Tester Access</span>
                  <Info className="w-4 h-4 text-gem-crystal" />
                </button>

                {showBetaInfo && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-dark-card border-2 border-gem-crystal/50 rounded-xl p-6 shadow-2xl z-50">
                    <button
                      onClick={() => setShowBetaInfo(false)}
                      className="absolute top-2 right-2 text-gem-crystal/60 hover:text-gem-crystal"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold text-gem-crystal mb-3">Beta Testing Phase</h3>
                    <div className="space-y-3 text-sm text-gem-crystal/80">
                      <p>
                        <strong className="text-white">What's happening:</strong><br/>
                        You're testing the onchain attestation ritual. All attestations are live on Base mainnet and permanent!
                      </p>
                      <p>
                        <strong className="text-white">What's next:</strong><br/>
                        • Streak milestone rewards distribution<br/>
                        • NFT rewards for 100-day streaks<br/>
                        • Community beta with 21 testers<br/>
                        • Full public launch
                      </p>
                      <p className="text-xs text-gem-crystal/60 pt-2 border-t border-gem-crystal/20">
                        Thank you for helping test! Your feedback is invaluable. 🙏
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              Prove You're BIZARRE Onchain
            </h1>
            <p className="text-lg text-gray-300 mb-2">
              Tell the world "I AM BIZARRE" and prove it onchain forever!
            </p>
            <p className="text-sm text-gray-500">
              {timeUntilReset} | Gas: {gasEstimate}
              {MOCK_MODE && <span className="text-gem-gold ml-2">(Mock Mode)</span>}
            </p>
          </div>

        {isBeta && (
          <>
        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 whitespace-pre-line">{error.includes('[Show technical details]') ? error.split('\n\n')[0] : error}</p>

                {/* Collapsible Technical Details */}
                {error.includes('[Show technical details]') && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-400/70 cursor-pointer hover:text-red-400 transition-colors">
                      Show technical details
                    </summary>
                    <div className="mt-2 p-3 bg-black/30 rounded border border-red-900/30 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-red-400/60 whitespace-pre-wrap break-all font-mono">
                        {localStorage.getItem('lastErrorDetails') || 'No details available'}
                      </pre>
                    </div>
                  </details>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* User Stats Card */}
        {wallet.address && userStats && (
          <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/10 border-2 border-gem-gold rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gem-gold">Your Proof Stats</h2>

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

            {/* Proof Button and Share */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleProve}
                disabled={!isCooldownExpired() || isAttesting || attestationComplete}
                className={`px-8 py-3 rounded-lg font-bold text-lg transition-all transform flex items-center gap-2 ${
                  attestationComplete
                    ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40 cursor-not-allowed'
                    : isCooldownExpired()
                    ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:scale-105 animate-pulse'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {attestationComplete ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Proven Today!
                  </>
                ) : isAttesting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-bg"></div>
                    Proving...
                  </>
                ) : isCooldownExpired() ? (
                  <>
                    🫵 I am BIZARRE! 👹
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
                    shareType="ritual"
                    ritualData={{
                      id: 10,
                      title: "Prove It",
                      description: "Prove that you are BIZARRE onchain, forever!"
                    }}
                    contextUrl="https://bbapp.bizarrebeasts.io/rituals/10"
                    buttonSize="md"
                    showLabels={false}
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

        {/* Attestation Cooldown Timer */}
        {wallet.address && (
          <div className="mb-8">
            <AttestationCooldown lastAttestationTime={lastAttestationTime} />
          </div>
        )}

        {/* Milestone Progress */}
        {wallet.address && userStats && (
          <div className="bg-gradient-to-br from-gem-crystal/10 via-dark-card to-gem-pink/10 border-2 border-gem-crystal/40 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gem-crystal to-gem-pink bg-clip-text text-transparent">
              Streak Milestones & Rewards
            </h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Current Streak Progress</span>
                <span className="text-sm font-bold text-gem-gold">{userStats.currentStreak} days</span>
              </div>
              <div className="relative h-6 bg-dark-bg rounded-full overflow-hidden border border-gem-crystal/30">
                <div
                  className="absolute h-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink transition-all duration-500"
                  style={{ width: `${Math.min((userStats.currentStreak / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Milestone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 7-Day Milestone */}
              <div className={`bg-dark-card rounded-lg p-4 border ${
                userStats.bestStreak >= 7
                  ? 'border-blue-400 bg-gradient-to-br from-blue-400/10 to-transparent'
                  : 'border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {userStats.bestStreak >= 7 ? (
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Zap className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold text-sm">7-Day Streak</span>
                  </div>
                  {userStats.bestStreak >= 7 && (
                    <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded">Done!</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Reward: <span className="text-blue-400 font-bold">25K $BB</span></p>
                  <p className="text-xs text-gray-500">
                    {userStats.bestStreak >= 7
                      ? '✅ Starter milestone complete!'
                      : `${7 - userStats.currentStreak} days to go`
                    }
                  </p>
                </div>
              </div>

              {/* 30-Day Milestone */}
              <div className={`bg-dark-card rounded-lg p-4 border ${
                userStats.bestStreak >= 30
                  ? 'border-gem-gold bg-gradient-to-br from-gem-gold/10 to-transparent'
                  : 'border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {userStats.bestStreak >= 30 ? (
                      <CheckCircle className="w-5 h-5 text-gem-gold" />
                    ) : (
                      <Trophy className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold">30-Day Streak</span>
                  </div>
                  {userStats.bestStreak >= 30 && (
                    <span className="text-xs bg-gem-gold/20 text-gem-gold px-2 py-1 rounded">Achieved!</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Reward: <span className="text-gem-gold font-bold">1M $BB</span></p>
                  <p className="text-xs text-gray-500">
                    {userStats.bestStreak >= 30
                      ? '✅ Milestone reached! Rewards coming soon.'
                      : `${30 - userStats.currentStreak} days to go`
                    }
                  </p>
                </div>
              </div>

              {/* 100-Day Milestone */}
              <div className={`bg-dark-card rounded-lg p-4 border ${
                userStats.bestStreak >= 100
                  ? 'border-gem-pink bg-gradient-to-br from-gem-pink/10 to-transparent'
                  : 'border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {userStats.bestStreak >= 100 ? (
                      <CheckCircle className="w-5 h-5 text-gem-pink" />
                    ) : (
                      <Flame className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold">100-Day Streak</span>
                  </div>
                  {userStats.bestStreak >= 100 && (
                    <span className="text-xs bg-gem-pink/20 text-gem-pink px-2 py-1 rounded">BIZARRE!</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">
                    Rewards: <span className="text-gem-pink font-bold">5M $BB + NFT</span>
                  </p>
                  <p className="text-xs text-gem-gold font-semibold">
                    + Permanent BIZARRE Tier Status 👹
                  </p>
                  <p className="text-xs text-gray-500">
                    {userStats.bestStreak >= 100
                      ? '🎉 BIZARRE tier unlocked forever!'
                      : `${100 - userStats.currentStreak} days to unlock BIZARRE tier`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-dark-bg/50 rounded-lg border border-gem-crystal/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gem-crystal mt-0.5" />
                <div className="text-xs text-gray-400">
                  <p className="mb-1">
                    <strong className="text-white">Dual Path to BIZARRE:</strong> Achieve BIZARRE tier through empire ranking OR dedication!
                  </p>
                  <p>Complete a 100-day attestation streak to permanently unlock BIZARRE tier status, regardless of your $BB holdings.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect Wallet Prompt */}
        {!wallet.address && (
          <div className="bg-gradient-to-br from-dark-card to-gem-crystal/10 border border-gem-crystal/30 rounded-xl p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to start proving you're BIZARRE onchain
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
              Proof Leaderboard
            </h2>
            <span className="text-sm text-gray-400">Top Provers</span>
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
              <p className="mb-4">No proofs yet. Be the first!</p>
              <p className="text-sm">Complete your first proof to appear on the leaderboard</p>
            </div>
          )}
        </div>

        {/* Info Section - Removed for cleaner UI */}

          {/* Milestones Preview */}
          <div className="mt-8 bg-gradient-to-br from-dark-card to-gem-gold/5 rounded-xl p-6 border border-gem-gold/20">
            <h3 className="text-xl font-bold text-gem-gold mb-4">Milestone Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl mb-2">🔥</p>
                <p className="font-bold text-white">7-Day Streak</p>
                <p className="text-gem-crystal text-sm mt-1">25K $BB</p>
              </div>
              <div className="text-center">
                <p className="text-3xl mb-2">🔥🔥🔥</p>
                <p className="font-bold text-white">30-Day Streak</p>
                <p className="text-gem-gold text-sm mt-1">1M $BB</p>
              </div>
              <div className="text-center">
                <p className="text-3xl mb-2">👹🏆</p>
                <p className="font-bold text-white">100-Day Streak</p>
                <p className="text-gem-pink text-sm mt-1">5M $BB + BIZARRE Tier</p>
              </div>
            </div>
          </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}