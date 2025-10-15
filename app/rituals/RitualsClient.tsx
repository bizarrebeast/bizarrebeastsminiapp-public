'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Check, BookOpen, Trophy, Zap, Users, Gamepad2, TrendingUp, Gift, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { getActiveCampaign } from '@/config/featured-ritual-config';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import ShareButtons from '@/components/ShareButtons';
import { openExternalUrl } from '@/lib/open-external-url';
import { sdk } from '@/lib/sdk-init';
import { authenticatedFetch } from '@/lib/auth/authenticated-fetch';
import { RITUAL_HASHTAGS } from '@/lib/ritual-hashtags';
import { isBetaTester, isPreviewMode, BETA_MY_WALLETS_ACTIVE, BETA_COMMUNITY_ACTIVE } from '@/lib/beta-testers';
import confetti from 'canvas-confetti';

// Dynamically import CollapsibleCheckIn to avoid SSR issues
const CollapsibleCheckIn = dynamic(() => import('@/components/CollapsibleCheckIn'), { ssr: false });

// Import ResetCountdown for daily reset timer
import ResetCountdown from '@/components/ResetCountdown';

interface Ritual {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  actionText: string;
  actionUrl: string;
  image: string;
  category: 'social' | 'gaming' | 'trading';
  icon: string;
}

// Ritual 10 is now controlled by beta tester status, not a hardcoded whitelist

// Base rituals (1-10) that everyone can see
const baseRituals: Ritual[] = [
  {
    id: 11,
    title: "Play and win BizBe's BIZARRE Coin Toss! 🪙",
    shortTitle: "Coin Toss",
    description: "Play and win BizBe's BIZARRE Coin Toss, then share your win!",
    actionText: "Play Now",
    actionUrl: "/flip",
    image: "/assets/page-assets/banners/rituals-boxes/bizbe-coin-toss-ritual-banner.png",
    category: 'gaming',
    icon: "🪙"
  },
  {
    id: 1,
    title: "Create a BizarreBeasts meme! 👹🎨",
    shortTitle: "Create Meme",
    description: "Create BB art and memes with the Sticker & Meme Creator!",
    actionText: "Create Meme",
    actionUrl: "/meme-generator",
    image: "/assets/page-assets/banners/rituals-boxes/memes-ritual-banner.png",
    category: 'social',
    icon: "🎨"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener! 🔥",
    shortTitle: "Dexscreener",
    description: "Support $BB on Dexscreener by hitting \"🚀\" and \"🔥\"!",
    actionText: "Open Dexscreener",
    actionUrl: "https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2",
    image: "/assets/page-assets/banners/rituals-boxes/dexscreener-ritual-banner.png",
    category: 'trading',
    icon: "🔥"
  },
  {
    id: 9,
    title: "Share your Leaderboard rank! 🏆",
    shortTitle: "Share Rank",
    description: "Show off your BizarreBeasts leaderboard rank and tier to the community, powered by $GLANKER!",
    actionText: "Check & Share",
    actionUrl: "/empire",
    image: "/assets/page-assets/banners/rituals-boxes/leaderboard-rank-rituals-bannker.png",
    category: 'social',
    icon: "🏆"
  },
  {
    id: 3,
    title: "Create your $BRND podium! 🏆",
    shortTitle: "$BRND Podium",
    description: "Create your @brnd podium with $BB in 🥇 and share!",
    actionText: "Create Podium",
    actionUrl: "https://farcaster.xyz/brnd?launchFrameUrl=https%3A%2F%2Fbrnd.land%2F",
    image: "/assets/page-assets/banners/rituals-boxes/brnd-ritual-banner.png",
    category: 'social',
    icon: "🏆"
  },
  {
    id: 4,
    title: "Send a #create GIVE! 🎨",
    shortTitle: "Send GIVE",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator\'s Directory!",
    actionText: "Send GIVE",
    actionUrl: "https://farcaster.xyz/~/compose?text=%40givebot%20%40bizarrebeast%20%23create%20-%20I%27m%20sending%20you%20%23create%20GIVE%20for%20being%20a%20great%20creator.%0A%0Ahttps%3A%2F%2Fdir.coordinape.com%2Fcreators%2Fbizarrebeasts.base.eth&embeds[]=https://dir.coordinape.com/creators/bizarrebeasts.base.eth",
    image: "/assets/page-assets/banners/rituals-boxes/create-give-ritual-banner.png",
    category: 'social',
    icon: "🎁"
  },
  {
    id: 5,
    title: "Believe in BizarreBeasts! 💎",
    shortTitle: "Believe",
    description: "\"Believe\" in BizarreBeasts ($BB) on @productclank",
    actionText: "Believe Now",
    actionUrl: "https://farcaster.xyz/miniapps/X_DQ70cYHoX0/productclank",
    image: "/assets/page-assets/banners/rituals-boxes/productclank-ritual-banner.png",
    category: 'social',
    icon: "💎"
  },
  {
    id: 6,
    title: "Play BizarreBeasts games! 🕹️",
    shortTitle: "Play Games",
    description: "Play BizarreBeasts games powered by /remix",
    actionText: "Play Games",
    actionUrl: "https://farcaster.xyz/miniapps/WnoFPCHF5Z6e/treasure-quest",
    image: "/assets/page-assets/banners/rituals-boxes/games-ritual-banner.png",
    category: 'gaming',
    icon: "🕹️"
  },
  {
    id: 7,
    title: "Rip a pack of cards! 🃏",
    shortTitle: "Rip Cards",
    description: "Rip a pack of BizarreBeasts ($BBCP) cards on @vibemarket",
    actionText: "Rip Pack",
    actionUrl: "https://vibechain.com/market/bizarrebeasts?ref=BJT4EJBY0SJP",
    image: "/assets/page-assets/banners/rituals-boxes/rip-cards-ritual-banner.png",
    category: 'gaming',
    icon: "🃏"
  },
  {
    id: 8,
    title: "Buy 1M $BB Tokens! 💰",
    shortTitle: "Buy $BB",
    description: "Grow your BizarreBeasts ($BB) bag and increase your rank on the empire leaderboard",
    actionText: "Buy $BB",
    actionUrl: "/swap",
    image: "/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png",
    category: 'trading',
    icon: "💰"
  }
];

// Ritual 10 - Only shown to whitelisted wallets
const ritual10: Ritual = {
  id: 10,
  title: "Prove It",
  shortTitle: "Prove It",
  description: "Prove that you are BIZARRE onchain, forever!",
  actionText: "Prove It! Onchain",
  actionUrl: "ATTEST_BIZARRE", // Special internal action
  image: "/assets/page-assets/banners/rituals-boxes/bizarre-attest-ritual-banner.png",
  category: 'social',
  icon: "👹"
};

// Get the featured ritual from config
const featuredRitual = getActiveCampaign();

// Helper function to get rituals based on wallet and beta status
const getRitualsForWallet = (walletAddress?: string): Ritual[] => {
  // Start with base rituals
  let rituals = [...baseRituals];

  // Hide ritual #10 if only MY_WALLETS beta is active (not community beta)
  // Ritual #11 (Coin Toss) is now available to everyone
  // When community beta is on, non-beta users can see them but can't use them (preview mode)
  if (BETA_MY_WALLETS_ACTIVE && !BETA_COMMUNITY_ACTIVE) {
    // Only show #10 to beta testers (Coin Toss #11 is public now)
    if (!isBetaTester(walletAddress || null)) {
      rituals = rituals.filter(r => r.id !== 10);
      return rituals;
    }
  }

  // Add ritual 10 for beta testers
  if (walletAddress && isBetaTester(walletAddress || null)) {
    rituals.unshift(ritual10); // Add to beginning
  }

  return rituals;
};

export default function RitualsPage() {
  const wallet = useWallet();
  const router = useRouter();

  // Use selectors to prevent unnecessary re-renders
  const farcasterConnected = useUnifiedAuthStore(state => state.farcasterConnected);
  const farcasterUsername = useUnifiedAuthStore(state => state.farcasterUsername);
  const farcasterFid = useUnifiedAuthStore(state => state.farcasterFid);

  const [completedRituals, setCompletedRituals] = useState<Set<number>>(new Set());
  const [featuredCompleted, setFeaturedCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'gaming' | 'trading'>('all');
  const [attestationCooldown, setAttestationCooldown] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [verifiedRituals, setVerifiedRituals] = useState<Set<number>>(new Set());
  const [pendingVerification, setPendingVerification] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebrationToday, setHasShownCelebrationToday] = useState(false);

  // Ref for celebration button to scroll to it
  const celebrationButtonRef = useRef<HTMLButtonElement>(null);

  // Get rituals based on current wallet
  const rituals = getRitualsForWallet(wallet.address || undefined);

  // Check if user is in preview mode (can see but not interact with beta features)
  const userInPreviewMode = isPreviewMode(wallet.address || null);

  // Centralized function to load ritual completions
  const loadRitualCompletions = async (showLoading = true) => {
    if (showLoading) setIsLoadingData(true);

    // Use localStorage only as temporary cache while database loads
    let localCache: Set<number> | null = null;
    try {
      const stored = localStorage.getItem('bizarreRitualsData');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (data.date === today) {
          localCache = new Set((data.rituals || []).map((id: any) => Number(id)));
          // Temporarily show cached data while loading
          setCompletedRituals(localCache);
          setFeaturedCompleted(data.featuredCompleted || false);
        }
      }
    } catch (e) {
      console.log('Could not load from localStorage:', e);
    }

    // Fetch from database - DATABASE IS AUTHORITATIVE SOURCE
    try {
      console.log('📊 Fetching rituals from database (authoritative source)');
      console.log('📱 Wallet:', wallet.address, 'FID:', farcasterFid);

      // Build URL with FID and wallet
      const params = new URLSearchParams();
      if (farcasterFid) {
        params.append('fid', farcasterFid.toString());
      }
      if (wallet.address) {
        params.append('wallet', wallet.address);
      }

      const url = `/api/rituals/complete${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await authenticatedFetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Database returned ritual completions:', data.completedRituals);
        console.log('✅ Database last attestation time:', data.lastAttestationTime);

        // Convert to numbers
        let ritualNumbers = data.completedRituals.map((id: any) => Number(id));

        // Special handling for ritual 10 - check 20-hour cooldown using DATABASE time
        if (ritualNumbers.includes(10)) {
          // Use database attestation time (authoritative) with localStorage fallback
          const lastTime = data.lastAttestationTime || localStorage.getItem('lastAttestationTime');

          if (lastTime) {
            const lastAttest = new Date(lastTime).getTime();
            const now = Date.now();
            const cooldownEnd = lastAttest + (20 * 60 * 60 * 1000);

            // If cooldown expired, remove ritual 10
            if (now >= cooldownEnd) {
              console.log('🔄 Ritual 10 cooldown expired, removing from completions');
              ritualNumbers = ritualNumbers.filter((id: number) => id !== 10);
            } else {
              console.log('⏰ Ritual 10 still in cooldown');
            }
          }

          // Sync database attestation time to localStorage for offline use
          if (data.lastAttestationTime) {
            localStorage.setItem('lastAttestationTime', data.lastAttestationTime);
          }
        }

        // DATABASE VALUES SUPERSEDE LOCALSTORAGE
        const ritualsSet = new Set<number>(ritualNumbers);
        console.log('📊 Database set size:', ritualsSet.size);
        setCompletedRituals(ritualsSet);
        setFeaturedCompleted(data.featuredCompleted);

        // UPDATE localStorage with database values (not the reverse)
        const savedData = {
          date: new Date().toISOString().split('T')[0],
          rituals: ritualNumbers,
          featuredCompleted: data.featuredCompleted
        };
        localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
        console.log('💾 Updated localStorage with database values');
      } else {
        console.error('❌ Failed to fetch rituals:', response.statusText);
        // On error, keep using localStorage cache if available
        if (localCache) {
          console.log('⚠️ Using localStorage cache due to database error');
        }
      }
    } catch (error) {
      console.error('❌ Error loading ritual completions:', error);
      // On error, keep using localStorage cache if available
      if (localCache) {
        console.log('⚠️ Using localStorage cache due to error');
      }
    } finally {
      // Check if ritual 10 should be included based on attestation time (for beta testers)
      const attestationTime = localStorage.getItem('lastAttestationTime');
      if (attestationTime && wallet.address && isBetaTester(wallet.address)) {
        const attestDate = new Date(attestationTime);
        const now = Date.now();
        const hoursSince = (now - attestDate.getTime()) / (1000 * 60 * 60);

        // If attestation was within last 20 hours, ensure ritual 10 is marked complete
        if (hoursSince < 20) {
          setCompletedRituals(prev => {
            const updated = new Set(prev);
            updated.add(10);
            console.log('📊 Added ritual 10 from attestation time check');
            return updated;
          });
        }
      }

      if (showLoading) setIsLoadingData(false);
    }
  };

  // Load ritual completions from database when wallet connects
  useEffect(() => {
    loadRitualCompletions();
  }, [wallet.address]);

  // Add refresh mechanism for cross-platform sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && wallet.address) {
        // Refresh completions when user returns to the app
        loadRitualCompletions(false);
      }
    };

    const handleFocus = () => {
      if (wallet.address) {
        // Refresh completions when window gains focus
        loadRitualCompletions(false);
      }
    };

    // Listen for ritual completion events (e.g., from attestation)
    const handleRitualCompleted = (event: CustomEvent) => {
      console.log('Ritual completed event received:', event.detail);
      // Refresh completions when a ritual is completed
      loadRitualCompletions(false);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('ritualCompleted', handleRitualCompleted as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('ritualCompleted', handleRitualCompleted as EventListener);
    };
  }, [wallet.address]);

  // Auto-scroll to celebration button when 100% completion is first achieved
  useEffect(() => {
    // Calculate completion status
    const totalRitualsCount = rituals.length + (featuredRitual ? 1 : 0);
    const currentCompletedCount = completedRituals.size + (featuredCompleted ? 1 : 0);
    const isFullyComplete = currentCompletedCount === totalRitualsCount && totalRitualsCount > 0;

    // Only scroll if we just reached 100% and the button exists
    if (isFullyComplete && celebrationButtonRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        celebrationButtonRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [completedRituals.size, featuredCompleted, rituals.length, featuredRitual]);

  // Update attestation cooldown timer
  useEffect(() => {
    const updateAttestationCooldown = () => {
      const lastTime = localStorage.getItem('lastAttestationTime');
      if (!lastTime) {
        setAttestationCooldown('');
        return;
      }

      const lastAttest = new Date(lastTime).getTime();
      const now = Date.now();
      const cooldownEnd = lastAttest + (20 * 60 * 60 * 1000); // 20 hours
      const diff = cooldownEnd - now;

      if (diff <= 0) {
        setAttestationCooldown('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setAttestationCooldown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateAttestationCooldown(); // Initial update
    const interval = setInterval(updateAttestationCooldown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle ritual action
  const handleRitualAction = async (ritual: Ritual) => {
    // Track the click
    try {
      await fetch('/api/rituals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: wallet.address || farcasterFid?.toString(),
          walletAddress: wallet.address,
          ritualId: ritual.id,
          ritualTitle: ritual.title,
          action: 'click_cta'
        })
      });
    } catch (error) {
      console.error('Error tracking ritual click:', error);
    }

    // Special handling for attestation ritual
    if (ritual.actionUrl === 'ATTEST_BIZARRE') {
      console.log('Attestation ritual clicked, navigating to /rituals/10');
      window.location.href = '/rituals/10';
      return;
    }

    // Check if it's an internal route (starts with /)
    if (ritual.actionUrl.startsWith('/')) {
      // Use Next.js router for internal navigation
      router.push(ritual.actionUrl);
    } else {
      // For external URLs, use openExternalUrl
      await openExternalUrl(ritual.actionUrl);
    }
  };

  // Handle featured ritual action
  const handleFeaturedRitualAction = async () => {
    if (featuredRitual) {
      // Track the click
      try {
        await fetch('/api/rituals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: wallet.address || farcasterFid?.toString(),
            walletAddress: wallet.address,
            ritualId: 0, // Featured ritual uses ID 0
            ritualTitle: featuredRitual.title,
            action: 'click_cta'
          })
        });
      } catch (error) {
        console.error('Error tracking featured ritual click:', error);
      }

      // Check if we're in Farcaster miniapp
      const inMiniApp = await sdk.isInMiniApp();

      // Special handling for Farverse featured ritual
      if (featuredRitual.actionUrl.includes('farverse.games')) {
        if (inMiniApp) {
          // In Farcaster: Use direct URL to open as miniapp
          await openExternalUrl(featuredRitual.actionUrl);
        } else {
          // In browser: Open the Farcaster cast link
          await openExternalUrl('https://farcaster.xyz/bizarrebeast/0xde7040b6');
        }
      } else {
        // For other featured rituals, use the normal URL
        await openExternalUrl(featuredRitual.actionUrl);
      }
    }
  };

  // Check if all rituals are completed and trigger celebration
  const checkForCelebration = () => {
    const today = new Date().toISOString().split('T')[0];
    const celebrationKey = `celebration_shown_${today}`;

    // Check if we've already shown celebration today
    if (hasShownCelebrationToday || localStorage.getItem(celebrationKey)) {
      return;
    }

    // Check if ALL available rituals are completed (including featured ritual)
    const allBaseRitualsComplete = rituals.every(r => completedRituals.has(r.id));
    const featuredRitualComplete = !featuredRitual || featuredCompleted;
    const allComplete = allBaseRitualsComplete && featuredRitualComplete;

    if (allComplete && rituals.length > 0) {
      // Mark as shown for today
      setHasShownCelebrationToday(true);
      localStorage.setItem(celebrationKey, 'true');

      // Fire confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#44D0A7', '#FFD700', '#FF69B4'] // gem-crystal, gem-gold, gem-pink
      });

      // Show celebration modal
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
    }
  };

  // Manual celebration trigger (for button)
  const handleCelebrate = () => {
    // Fire confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#44D0A7', '#FFD700', '#FF69B4'] // gem-crystal, gem-gold, gem-pink
    });

    // Show celebration modal
    setShowCelebration(true);
  };

  // Callback for when a ritual share is verified
  const handleRitualVerified = async (ritualId: number) => {
    console.log('Ritual share verified:', ritualId);

    setCompletedRituals(prev => new Set([...prev, ritualId]));
    setVerifiedRituals(prev => new Set([...prev, ritualId]));
    setPendingVerification(prev => {
      const newPending = new Set(prev);
      newPending.delete(ritualId);
      return newPending;
    });

    const ritual = rituals.find(r => r.id === ritualId);

    // Track the completion
    if (wallet.address || farcasterFid) {
      try {
        await fetch('/api/rituals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: wallet.address || farcasterFid?.toString(),
            walletAddress: wallet.address,
            ritualId: ritualId,
            ritualTitle: ritual?.title || `Ritual ${ritualId}`,
            completed: true,
            timeToComplete: 0 // We don't track time for now
          })
        });
      } catch (error) {
        console.error('Error tracking ritual completion:', error);
      }
    }

    // Also save to the original endpoint for backward compatibility
    // Use authenticatedFetch even without wallet - server will use FID
    try {
      await authenticatedFetch('/api/rituals/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            ritualId: ritualId,
            fid: farcasterFid, // Include FID for unified tracking
            shared: true
          })
        });

      // REFETCH from database after saving to ensure sync
      console.log('✅ Ritual saved to database, refetching to sync...');
      await loadRitualCompletions(false);

      // Check if all rituals are now complete and trigger celebration
      checkForCelebration();
    } catch (error) {
      console.error('Error saving ritual completion:', error);

      // Fallback: Update localStorage manually only if database save failed
      const newCompleted = new Set([...completedRituals, ritualId]);
      const savedData = {
        date: new Date().toISOString().split('T')[0],
        rituals: Array.from(newCompleted),
        featuredCompleted: featuredCompleted
      };
      localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
    }
  };

  // Callback for featured ritual verification
  const handleFeaturedRitualVerified = async () => {
    console.log('Featured ritual share verified');
    setFeaturedCompleted(true);

    // Track the featured ritual completion
    if ((wallet.address || farcasterFid) && featuredRitual) {
      try {
        await fetch('/api/rituals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: wallet.address || farcasterFid?.toString(),
            walletAddress: wallet.address,
            ritualId: 0, // Featured ritual uses ID 0
            ritualTitle: featuredRitual.title,
            completed: true,
            timeToComplete: 0
          })
        });
      } catch (error) {
        console.error('Error tracking featured ritual completion:', error);
      }
    }

    // Also save to the unified endpoint for backward compatibility
    if (featuredRitual) {
      // Use authenticatedFetch - server will use FID if no wallet
      try {
        await authenticatedFetch('/api/rituals/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            ritualId: 0, // Featured ritual uses ID 0
            fid: farcasterFid, // Include FID for unified tracking
            shared: true
          })
        });

        // REFETCH from database after saving to ensure sync
        console.log('✅ Featured ritual saved to database, refetching to sync...');
        await loadRitualCompletions(false);
      } catch (error) {
        console.error('Error saving featured ritual completion:', error);

        // Fallback: Update localStorage manually only if database save failed
        const savedData = {
          date: new Date().toISOString().split('T')[0],
          rituals: Array.from(completedRituals),
          featuredCompleted: true
        };
        localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
      }
    }
  };

  const filteredRituals = selectedCategory === 'all'
    ? rituals
    : rituals.filter(r => r.category === selectedCategory);

  // Include featured ritual in total count (it's shown in the grid placeholder)
  const totalRituals = rituals.length + (featuredRitual ? 1 : 0);
  const completedCount = completedRituals.size + (featuredCompleted ? 1 : 0);
  const completionPercentage = Math.round((completedCount / totalRituals) * 100);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'social': return <Users className="w-4 h-4" />;
      case 'gaming': return <Gamepad2 className="w-4 h-4" />;
      case 'trading': return <TrendingUp className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'social': return 'text-gem-crystal border-gem-crystal/30';
      case 'gaming': return 'text-gem-pink border-gem-pink/30';
      case 'trading': return 'text-gem-gold border-gem-gold/30';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden max-w-full">
      <div className="max-w-4xl mx-auto w-full overflow-x-hidden">
        {/* Streamlined Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            BIZARRE Rituals & Check-In
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto mb-4 px-2">
            Complete the featured ritual, daily rituals, and check-ins to earn $BB rewards and strengthen our community. Your consistency drives $BIZARRE forward!
          </p>
        </div>

        {/* Featured Ritual - Below How-To Guide */}
        {featuredRitual && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/10 border-2 border-gem-gold rounded-2xl overflow-hidden shadow-xl hover:shadow-gem-gold/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gem-gold/30 to-gem-crystal/30 px-3 sm:px-6 py-2">
                <div className="relative flex items-center justify-center">
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-xl">⭐</span>
                    <span>
                      {featuredRitual.sponsorType ? (
                        featuredRitual.sponsorType === 'sponsored' ? 'SPONSORED RITUAL' :
                        featuredRitual.sponsorType === 'collab' ? 'COLLABORATION' :
                        'PARTNER RITUAL'
                      ) : (
                        'FEATURED RITUAL'
                      )}
                    </span>
                    <span className="text-base sm:text-xl">⭐</span>
                  </h2>
                  {featuredRitual.sponsorType && (
                    <span className="absolute right-0 text-xs bg-black/30 px-2 py-1 rounded-full text-gem-gold hidden sm:block">
                      {featuredRitual.sponsorType === 'sponsored' ? 'AD' :
                       featuredRitual.sponsorType === 'collab' ? 'COLLAB' :
                       'PARTNER'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-48 h-48 sm:h-56 md:h-auto bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden flex-shrink-0">
                  <img
                    src={featuredRitual.image}
                    alt={featuredRitual.title}
                    className="w-full h-full object-cover"
                  />
                  {featuredCompleted && (
                    <div className="absolute inset-0 bg-gem-gold/20 flex items-center justify-center">
                      <Check className="w-12 h-12 text-gem-gold" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3 sm:p-4 md:p-5">
                  <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent flex items-center justify-center gap-2 text-center">
                    {featuredRitual.title}
                    {featuredCompleted && (
                      <Check className="w-5 h-5 text-gem-gold inline" />
                    )}
                  </h3>

                  <div className="text-gray-300 mb-3 text-sm leading-relaxed">
                    {featuredRitual.description.split('\n\n')[0]}
                  </div>

                  <div className="space-y-3">
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
                      <button
                        onClick={handleFeaturedRitualAction}
                        className={`inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 transform ${
                          featuredCompleted
                            ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                            : 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg hover:brightness-110 hover:shadow-lg'
                        }`}
                      >
                        {featuredCompleted ? (
                          <>
                            <Check className="w-3 h-3" />
                            Completed
                          </>
                        ) : (
                          <>
                            {featuredRitual.actionText}
                            <ExternalLink className="w-3 h-3" />
                          </>
                        )}
                      </button>

                      {featuredRitual.learnMoreUrl && (
                        <button
                          onClick={async () => await openExternalUrl(featuredRitual.learnMoreUrl!)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 bg-dark-card border border-gem-crystal/50 text-gem-crystal hover:bg-gem-crystal/20"
                        >
                          {featuredRitual.learnMoreText || 'Learn More'}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Share Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-semibold">Share:</span>
                      <ShareButtons
                        customText={featuredRitual.shareText || `🚨 FEATURED RITUAL ALERT! 🚨\n\n${featuredRitual.shareTitle || featuredRitual.title}\n\n${featuredRitual.description.split('\n\n')[0]}`}
                        shareType="ritual"
                        ritualData={{
                          id: "featured",
                          title: featuredRitual.title,
                          description: featuredRitual.description,
                          actionUrl: featuredRitual.actionUrl
                        }}
                        buttonSize="sm"
                        showLabels={false}
                        contextUrl={featuredRitual.shareEmbed || "https://bbapp.bizarrebeasts.io/rituals/featured"}
                        onVerified={() => handleFeaturedRitualVerified()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partnership CTA Button - Below Featured Box */}
            <div className="text-center mt-4">
              <button
                onClick={() => window.location.href = '/contact'}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-dark-card to-gem-gold/10 border border-gem-gold/30 text-gem-gold font-semibold text-sm rounded-lg hover:from-gem-gold/20 hover:to-gem-gold/30 hover:border-gem-gold/50 transition-all group"
              >
                <span>Want to feature your project here?</span>
                <span className="text-xs opacity-70 group-hover:opacity-100">Learn more →</span>
              </button>
            </div>
          </div>
        )}

        {/* Share Verification Notice - Only show if not connected */}
        {!farcasterConnected && (
          <div className="mb-6 bg-gradient-to-br from-gem-crystal/10 to-gem-gold/10 border border-gem-crystal/30 rounded-xl p-4">
            <div className="mb-3">
              <h3 className="font-bold text-gem-crystal mb-1">🔐 Enable Share Verification</h3>
              <p className="text-xs text-gray-400">
                Connect with Farcaster using the button in the navigation bar to verify your ritual shares and earn real rewards!
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {farcasterUsername ? `Connected as @${farcasterUsername}` : (
                <>
                  No Farcaster account? Shares will be marked but not verified. DM{' '}
                  <a
                    href="https://x.com/bizarrebeasts_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gem-crystal hover:text-gem-gold transition-colors"
                  >
                    @bizarrebeasts_
                  </a>
                  {' '}on X for a Farcaster invite.
                </>
              )}
            </p>
          </div>
        )}

        {/* Rituals Section Header - Simplified */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            ✔️ Complete & Share Your Daily BIZARRE Rituals
          </h2>
          {/* Simplified inline steps */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="text-gem-gold">1</span> Complete
            </span>
            <span className="text-gray-600">→</span>
            <span className="flex items-center gap-1">
              <span className="text-gem-gold">2</span> Share
            </span>
            <span className="text-gray-600">→</span>
            <span className="flex items-center gap-1">
              <span className="text-gem-gold">3</span> Check-in
            </span>
          </div>
        </div>

        {/* Compact Stats & Actions Card */}
        <div className="mb-6">
          <div className="bg-dark-card/80 border border-gray-700 rounded-xl p-4 backdrop-blur-sm">
            {/* Progress Bar or Celebration Button */}
            {completedCount === totalRituals ? (
              /* 100% Complete - Celebration Button */
              <button
                ref={celebrationButtonRef}
                onClick={handleCelebrate}
                className="w-full mb-3 px-6 py-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-bold text-base sm:text-lg rounded-xl hover:shadow-2xl hover:shadow-gem-gold/50 transform hover:scale-[1.02] transition-all duration-300 animate-pulse"
              >
                🏆 100% COMPLETE! Tap to celebrate & share! 🎉
              </button>
            ) : (
              /* Normal Progress Bar */
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Progress {!wallet.address && '(No wallet)'}</span>
                  <span className="text-sm font-bold text-gem-gold">{completedCount}/{totalRituals}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Info Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Reset Timer */}
              <div className="flex items-center gap-2 text-gray-400">
                <ResetCountdown />
              </div>

              {/* Check-in Status */}
              <div className="text-gray-400">
                {completedCount >= 3 ? (
                  <span className="text-gem-gold">✨ Check-in unlocked</span>
                ) : (
                  <span>{3 - completedCount} more to unlock check-in</span>
                )}
              </div>

              {/* How-To Guide */}
              <a
                href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-daily-rituals-and-check-ins"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 border border-gem-gold/30 text-gem-gold hover:border-gem-gold/50 rounded-md transition-all text-xs font-semibold"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Collapsible Check-In Section - Always visible */}
        <div className="mb-6">
          <CollapsibleCheckIn completedRituals={completedCount} />
        </div>

        {/* Category Filter & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                  : 'bg-dark-card border border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('social')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 ${
                selectedCategory === 'social'
                  ? 'bg-gem-crystal/20 text-gem-crystal border border-gem-crystal/40'
                  : 'bg-dark-card border border-gray-600 text-gray-400 hover:border-gem-crystal/30'
              }`}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Social
            </button>
            <button
              onClick={() => setSelectedCategory('gaming')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 ${
                selectedCategory === 'gaming'
                  ? 'bg-gem-pink/20 text-gem-pink border border-gem-pink/40'
                  : 'bg-dark-card border border-gray-600 text-gray-400 hover:border-gem-pink/30'
              }`}
            >
              <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Gaming
            </button>
            <button
              onClick={() => setSelectedCategory('trading')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 ${
                selectedCategory === 'trading'
                  ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                  : 'bg-dark-card border border-gray-600 text-gray-400 hover:border-gem-gold/30'
              }`}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              Trading
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-gem-gold/20 text-gem-gold'
                  : 'bg-dark-card text-gray-400 hover:text-gray-300'
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" />
                <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" />
                <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" />
                <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-gem-gold/20 text-gem-gold'
                  : 'bg-dark-card text-gray-400 hover:text-gray-300'
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>


        {/* Rituals Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredRituals.map((ritual) => {
              const isCompleted = completedRituals.has(ritual.id);

              // Get border color based on category
              const getBorderColor = () => {
                if (isCompleted) return 'border-gem-gold/40 shadow-gem-gold/20';
                switch(ritual.category) {
                  case 'social': return 'border-gem-crystal/30 hover:border-gem-crystal/50 hover:shadow-gem-crystal/20';
                  case 'gaming': return 'border-gem-pink/30 hover:border-gem-pink/50 hover:shadow-gem-pink/20';
                  case 'trading': return 'border-gem-gold/30 hover:border-gem-gold/50 hover:shadow-gem-gold/20';
                  default: return 'border-gray-700 hover:border-gray-600';
                }
              };

              return (
                <div
                  key={ritual.id}
                  className={`group relative bg-dark-card border-2 rounded-xl overflow-hidden transition-all duration-300 ${getBorderColor()}`}
                >
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 z-10 bg-gem-gold/90 rounded-full p-2">
                      <Check className="w-4 h-4 text-dark-bg" />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold ${getCategoryColor(ritual.category)}`}>
                      {getCategoryIcon(ritual.category)}
                      <span className="hidden sm:inline">{ritual.category}</span>
                    </div>
                  </div>

                  {/* Image - Fixed mobile height */}
                  <div className="h-48 sm:h-32 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    <img
                      src={ritual.image}
                      alt={ritual.title}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent opacity-60" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{ritual.icon}</span>
                        <h3 className="font-bold text-white text-base">{ritual.shortTitle}</h3>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ritual.description}</p>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRitualAction(ritual)}
                        className={`w-full py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          isCompleted
                            ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                            : (userInPreviewMode && ritual.id === 10)
                            ? 'bg-gem-purple/20 text-gem-purple border border-gem-purple/40'
                            : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:shadow-lg hover:brightness-110'
                        }`}
                      >
                        {isCompleted ? (
                          ritual.id === 10 && attestationCooldown ? (
                            <>
                              <Clock className="w-4 h-4" />
                              {attestationCooldown}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Completed
                            </>
                          )
                        ) : userInPreviewMode && ritual.id === 10 ? (
                          <>
                            Preview
                            <ExternalLink className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {ritual.actionText}
                            <ExternalLink className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-semibold">Share:</span>
                        <ShareButtons
                          customText={`Daily BIZARRE Ritual #${ritual.id}: ${ritual.title}\n\n${ritual.description}\n\nJoin me in completing daily $BIZARRE rituals in the BizarreBeasts ($BB) Community! 👹\n\n@bizarrebeast \n\n#BizarreBeasts #BBRituals ${RITUAL_HASHTAGS[ritual.id] || '#BBRituals'}`}
                          shareType="ritual"
                          ritualData={{
                            id: ritual.id,
                            title: ritual.title,
                            description: ritual.description,
                            actionUrl: ritual.actionUrl
                          }}
                          buttonSize="sm"
                          showLabels={false}
                          contextUrl={`https://bbapp.bizarrebeasts.io/rituals/${ritual.id}`}
                          onVerified={() => handleRitualVerified(ritual.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Featured Ritual Placeholder Card */}
            <div
              className={`group relative bg-dark-card border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                featuredCompleted
                  ? 'border-gem-gold/40 shadow-gem-gold/20'
                  : 'border-gem-gold/30 hover:border-gem-gold/50 hover:shadow-gem-gold/20'
              }`}
            >
              {/* Completion Badge */}
              {featuredCompleted && (
                <div className="absolute top-3 right-3 z-10 bg-gem-gold/90 rounded-full p-2">
                  <Check className="w-4 h-4 text-dark-bg" />
                </div>
              )}

              {/* Featured Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-gem-gold">
                  <span className="text-base">⭐</span>
                  <span className="hidden sm:inline">Featured</span>
                </div>
              </div>

              {/* Content Area - Arrow pointing up */}
              <div className="h-48 sm:h-32 bg-gradient-to-br from-gem-gold/10 via-dark-card to-gem-gold/5 relative overflow-hidden flex items-center justify-center">
                {featuredCompleted ? (
                  <div className="text-center">
                    <Check className="w-16 h-16 text-gem-gold mx-auto mb-2" />
                    <p className="text-gem-gold font-bold text-lg">Featured Complete!</p>
                  </div>
                ) : (
                  <div className="text-center animate-bounce">
                    <div className="text-6xl text-gem-gold mb-2">↑</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent opacity-60" />
              </div>

              {/* Text Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <h3 className="font-bold text-white text-base">Featured Ritual</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-3">
                  {featuredCompleted
                    ? 'You completed the featured ritual above!'
                    : 'Complete the featured ritual section above'}
                </p>

                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    featuredCompleted
                      ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                      : 'bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-gold text-dark-bg hover:shadow-lg hover:brightness-110'
                  }`}
                >
                  {featuredCompleted ? 'Completed ✓' : 'Scroll to Featured ↑'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {filteredRituals.map((ritual) => {
              const isCompleted = completedRituals.has(ritual.id);

              return (
                <div
                  key={ritual.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-dark-card border rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${
                    isCompleted
                      ? 'border-gem-gold/40'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Mobile layout: Image on top */}
                  <div className="w-full sm:w-32 h-48 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={ritual.image}
                      alt={ritual.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{ritual.icon}</span>
                      <h3 className="font-bold text-white text-lg">{ritual.title}</h3>
                      <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCategoryColor(ritual.category)}`}>
                        {getCategoryIcon(ritual.category)}
                        <span>{ritual.category}</span>
                      </div>
                    </div>
                    <p className="text-base text-gray-400 mb-2">{ritual.description}</p>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleRitualAction(ritual)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                          isCompleted
                            ? 'bg-gray-700 text-gray-400'
                            : (userInPreviewMode && ritual.id === 10)
                            ? 'bg-gem-purple/20 text-gem-purple border border-gem-purple/40'
                            : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:shadow-lg'
                        }`}
                      >
                        {isCompleted ? (
                          ritual.id === 10 && attestationCooldown ? (
                            <>
                              <Clock className="w-4 h-4" />
                              {attestationCooldown}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Done
                            </>
                          )
                        ) : userInPreviewMode && ritual.id === 10 ? (
                          <>
                            Preview
                            <ExternalLink className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {ritual.actionText}
                            <ExternalLink className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Share:</span>
                        <ShareButtons
                          customText={`Daily BIZARRE Ritual #${ritual.id}: ${ritual.title}\n\n${ritual.description}\n\nJoin me in completing daily $BIZARRE rituals in the BizarreBeasts ($BB) Community! 👹\n\n@bizarrebeast \n\n#BizarreBeasts #BBRituals ${RITUAL_HASHTAGS[ritual.id] || '#BBRituals'}`}
                          shareType="ritual"
                          ritualData={{
                            id: ritual.id,
                            title: ritual.title,
                            description: ritual.description,
                            actionUrl: ritual.actionUrl
                          }}
                          buttonSize="sm"
                          showLabels={false}
                          contextUrl={`https://bbapp.bizarrebeasts.io/rituals/${ritual.id}`}
                          onVerified={() => handleRitualVerified(ritual.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share Progress Section - Only show if some rituals are completed */}
        {(completedCount > 0) && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                {completedCount === totalRituals
                  ? "🏆 All Rituals Complete!"
                  : `👹 ${completedCount} Ritual${completedCount > 1 ? 's' : ''} Complete!`}
              </h2>
              <p className="text-gray-300 mb-6">
                {completedCount === totalRituals
                  ? "You've completed all BIZARRE Rituals! Share your achievement with the community!"
                  : "Great progress! Share your ritual journey with the BizarreBeasts community!"}
              </p>

              {/* Celebration Button - Only show when ALL rituals complete */}
              {completedCount === totalRituals && (
                <button
                  onClick={handleCelebrate}
                  className="w-full sm:w-auto mb-6 px-8 py-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-gem-gold/50 transform hover:scale-105 transition-all duration-300"
                >
                  🎉 Celebrate Your Achievement! 🎉
                </button>
              )}

              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-gray-400">Share your progress:</p>
                <ShareButtons
                  customText={`I've completed ${completedCount} of ${totalRituals} Daily BIZARRE Rituals! 👹\n\nJoin me in the BizarreBeasts ($BB) Community!`}
                  shareType="default"
                  buttonSize="md"
                  showLabels={false}
                  className="justify-center"
                  contextUrl="https://bbapp.bizarrebeasts.io/rituals"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Info */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Complete rituals daily to engage with the BizarreBeasts ecosystem!</p>
          <p className="mt-2">Progress resets daily at midnight • Come back tomorrow for fresh rituals!</p>
        </div>

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="relative bg-dark-card border-4 border-gem-gold rounded-3xl p-4 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-gem-gold/30 animate-in zoom-in duration-500 my-auto">
              {/* Logo - smaller on mobile */}
              <div className="relative mb-3 sm:mb-6 flex justify-center">
                <div className="relative">
                  <img
                    src="/icon-192.png"
                    alt="BizarreBeasts"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl mx-auto shadow-xl shadow-gem-gold/30 ring-4 ring-gem-gold/40"
                  />
                </div>
              </div>

              {/* Main heading with animated gradient - smaller on mobile */}
              <h2 className="text-3xl sm:text-5xl font-black mb-2 sm:mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent animate-in slide-in-from-top duration-700">
                100% BIZARRE!
              </h2>

              {/* Subheading - smaller on mobile */}
              <div className="mb-4 sm:mb-8 space-y-1 sm:space-y-2">
                <p className="text-lg sm:text-2xl font-bold text-white animate-in slide-in-from-left duration-700">
                  ALL RITUALS COMPLETE!
                </p>
                <p className="text-xl sm:text-3xl font-black text-gem-gold animate-in slide-in-from-right duration-700">
                  YOU'RE A BEAST! 👹
                </p>
              </div>

              {/* Share prompt with gradient background - compact on mobile */}
              <div className="mb-4 sm:mb-8 p-3 sm:p-6 bg-gradient-to-br from-gem-gold/10 via-gem-crystal/10 to-gem-pink/10 rounded-2xl border-2 border-gem-gold/30 shadow-lg">
                <p className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">
                  Share your BIZARRE achievement!
                </p>

                <ShareButtons
                  customText={`I just completed ALL my daily BIZARRE rituals on the BizarreBeasts ($BB) Miniapp! 🔥

I'm a BEAST! 👹

Join me and go BIZARRE with daily community interactions!

CC @bizarrebeast

https://bbapp.bizarrebeasts.io/rituals`}
                  shareType="default"
                  contextUrl="https://bbapp.bizarrebeasts.io/rituals"
                  buttonSize="lg"
                  showLabels={true}
                  className="justify-center"
                />
              </div>

              {/* Close button with gradient - smaller on mobile */}
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink hover:from-gem-gold hover:via-gem-pink hover:to-gem-crystal text-black font-bold text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                Close & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}