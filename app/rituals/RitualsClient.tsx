'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Check, BookOpen, Trophy, Zap, Users, Gamepad2, TrendingUp, Gift, RefreshCw, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useWallet } from '@/hooks/useWallet';
import { getActiveCampaign } from '@/config/featured-ritual-config';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import ShareButtons from '@/components/ShareButtons';
import { openExternalUrl } from '@/lib/open-external-url';

// Dynamically import CollapsibleCheckIn to avoid SSR issues
const CollapsibleCheckIn = dynamic(() => import('@/components/CollapsibleCheckIn'), { ssr: false });

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

// Whitelist for ritual 10 (Prove It feature) - Only these wallets can see it
const RITUAL_10_WHITELIST = [
  '0x4F2EcDA8C10EC8Fbe711f6664970826998B81c3E',
  '0x300a8611D53ca380dA1c556Ca5F8a64D8e1A9dfB',
  '0x3FDD6aFEd7a19990632468c7102219d051E685dB'
].map(addr => addr.toLowerCase());

// Base rituals (1-9) that everyone can see
const baseRituals: Ritual[] = [
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
  category: 'trading',
  icon: "👹"
};

// Get the featured ritual from config
const featuredRitual = getActiveCampaign();

// Helper function to get rituals based on wallet
const getRitualsForWallet = (walletAddress?: string): Ritual[] => {
  const rituals = [...baseRituals];

  // Only add ritual 10 if wallet is whitelisted
  if (walletAddress && RITUAL_10_WHITELIST.includes(walletAddress.toLowerCase())) {
    rituals.push(ritual10);
  }

  return rituals;
};

export default function RitualsPage() {
  const wallet = useWallet();
  const [completedRituals, setCompletedRituals] = useState<Set<number>>(new Set());
  const [featuredCompleted, setFeaturedCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'gaming' | 'trading'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [verifiedRituals, setVerifiedRituals] = useState<Set<number>>(new Set());
  const [pendingVerification, setPendingVerification] = useState<Set<number>>(new Set());

  // Get rituals based on current wallet
  const rituals = getRitualsForWallet(wallet.address || undefined);

  // Get unified auth state
  const { farcasterConnected, farcasterUsername, farcasterFid } = useUnifiedAuthStore();

  // Load ritual completions from database when wallet connects
  useEffect(() => {
    const loadRitualCompletions = async () => {
      if (!wallet.address) {
        // Try localStorage fallback
        try {
          const stored = localStorage.getItem('bizarreRitualsData');
          if (stored) {
            const data = JSON.parse(stored);
            const today = new Date().toDateString();
            if (data.date === today) {
              setCompletedRituals(new Set(data.rituals || []));
              setFeaturedCompleted(data.featuredCompleted || false);
            }
          }
        } catch (e) {
          console.log('Could not load from localStorage:', e);
        }
        setIsLoadingData(false);
        return;
      }

      try {
        // Fetch from database
        const response = await fetch(`/api/rituals/complete?wallet=${wallet.address}`);
        if (response.ok) {
          const data = await response.json();
          setCompletedRituals(new Set(data.completedRituals));
          setFeaturedCompleted(data.featuredCompleted);

          // Also update localStorage
          const savedData = {
            date: new Date().toDateString(),
            rituals: data.completedRituals,
            featuredCompleted: data.featuredCompleted
          };
          localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
        }
      } catch (error) {
        console.error('Error loading ritual completions:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadRitualCompletions();
  }, [wallet.address]);

  // Handle ritual action
  const handleRitualAction = async (ritual: Ritual) => {
    // Special handling for attestation ritual
    if (ritual.actionUrl === 'ATTEST_BIZARRE') {
      console.log('Attestation ritual clicked, navigating to /rituals/10');
      window.location.href = '/rituals/10';
      return;
    }
    // Don't mark as completed here - only after share verification
    await openExternalUrl(ritual.actionUrl);
  };

  // Handle featured ritual action
  const handleFeaturedRitualAction = async () => {
    if (featuredRitual) {
      await openExternalUrl(featuredRitual.actionUrl);
    }
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

    // Save to database if wallet connected
    if (wallet.address) {
      try {
        await fetch('/api/rituals/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            ritualId: ritualId,
            shared: true
          })
        });
      } catch (error) {
        console.error('Error saving ritual completion:', error);
      }
    }

    // Update localStorage
    const newCompleted = new Set([...completedRituals, ritualId]);
    const savedData = {
      date: new Date().toDateString(),
      rituals: Array.from(newCompleted),
      featuredCompleted: featuredCompleted
    };
    localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
  };

  // Callback for featured ritual verification
  const handleFeaturedRitualVerified = async () => {
    console.log('Featured ritual share verified');
    setFeaturedCompleted(true);

    // Save to database if wallet connected
    if (wallet.address && featuredRitual) {
      try {
        await fetch('/api/rituals/featured-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            featuredRitualId: featuredRitual.title
          })
        });
      } catch (error) {
        console.error('Error saving featured ritual completion:', error);
      }
    }

    // Update localStorage
    const savedData = {
      date: new Date().toDateString(),
      rituals: Array.from(completedRituals),
      featuredCompleted: true
    };
    localStorage.setItem('bizarreRitualsData', JSON.stringify(savedData));
  };

  const filteredRituals = selectedCategory === 'all'
    ? rituals
    : rituals.filter(r => r.category === selectedCategory);

  // Include featured ritual in total count
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
        {/* Streamlined Header with integrated progress */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            BIZARRE Rituals & Daily Check-In
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-4 px-2">
            Complete daily rituals and check-ins to engage with the BizarreBeasts ecosystem, earn $BB rewards, and strengthen our community. Your consistency drives the $BIZARRE movement forward!
          </p>

          {/* Integrated Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Daily Progress</span>
              <span className="text-sm font-bold text-gem-gold">{completedCount}/{totalRituals} Complete</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completedCount >= 3 ? (
              <p className="text-xs text-gem-gold mt-1">✨ Check-in rewards unlocked!</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Complete and share {3 - completedCount} more to unlock check-in rewards
              </p>
            )}
          </div>

          {/* How-To Guide Button - Styled like original */}
          <a
            href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-daily-rituals-and-check-ins"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded-lg hover:shadow-lg hover:brightness-110 transition-all duration-300"
          >
            <BookOpen className="w-5 h-5" />
            How-To Guide
            <ExternalLink className="w-4 h-4" />
          </a>
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
                onClick={() => window.open('/partnerships', '_blank')}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-dark-card to-gem-gold/10 border border-gem-gold/30 text-gem-gold font-semibold text-sm rounded-lg hover:from-gem-gold/20 hover:to-gem-gold/30 hover:border-gem-gold/50 transition-all group"
              >
                <span className="text-base">🤝</span>
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
              {farcasterUsername ? `Connected as @${farcasterUsername}` : 'No Farcaster account? Shares will be marked but not verified.'}
            </p>
          </div>
        )}

        {/* Rituals Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            ✔️ Complete & Share Your Daily BIZARRE Rituals
          </h2>
          <p className="text-lg text-gray-400">
            Each ritual helps you engage with different parts of the BizarreBeasts ecosystem.
            Complete and share any 3 to unlock check-in rewards!
          </p>
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

              return (
                <div
                  key={ritual.id}
                  className={`group relative bg-dark-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isCompleted
                      ? 'border-gem-gold/40 shadow-gem-gold/20'
                      : 'border-gray-700 hover:border-gem-gold/50 hover:bg-gem-gold/5'
                  }`}
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
                            : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:shadow-lg hover:brightness-110'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-4 h-4" />
                            Completed
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
                            : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:shadow-lg'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-4 h-4" />
                            Done
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
      </div>
    </div>
  );
}