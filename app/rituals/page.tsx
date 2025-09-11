'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Check, Share2, Share } from 'lucide-react';
import { ultimateShare } from '@/lib/sdk-ultimate';
import { sdk } from '@/lib/sdk-init';

interface Ritual {
  id: number;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  image: string;
}

const rituals: Ritual[] = [
  {
    id: 1,
    title: "Create a BizarreBeasts meme! 👹🎨",
    description: "Create BB art and memes with the Sticker & Meme Creator!",
    actionText: "Create Meme",
    actionUrl: "/meme-generator",
    image: "/assets/page-assets/banners/rituals-boxes/memes-ritual-banner.png"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener! 🔥",
    description: "Support $BB on Dexscreener by hitting \"🚀\" and \"🔥\"!",
    actionText: "Open Dexscreener",
    actionUrl: "https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2",
    image: "/assets/page-assets/banners/rituals-boxes/dexscreener-ritual-banner.png"
  },
  {
    id: 3,
    title: "Create your $BRND podium! 🏆",
    description: "Create your @brnd podium with $BB in 🥇 and share!",
    actionText: "Create Podium",
    actionUrl: "https://farcaster.xyz/brnd?launchFrameUrl=https%3A%2F%2Fbrnd.land%2F",
    image: "/assets/page-assets/banners/rituals-boxes/brnd-ritual-banner.png"
  },
  {
    id: 4,
    title: "Send a #create GIVE! 🎨",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator's Directory!",
    actionText: "Send GIVE",
    actionUrl: "https://farcaster.xyz/~/compose?text=%40givebot%20%40bizarrebeast%20%23create%20-%20I%27m%20sending%20you%20%23create%20GIVE%20for%20being%20a%20great%20creator.%0A%0Ahttps%3A%2F%2Fdir.coordinape.com%2Fcreators%2Fbizarrebeasts.base.eth&embeds[]=https://dir.coordinape.com/creators/bizarrebeasts.base.eth",
    image: "/assets/page-assets/banners/rituals-boxes/create-give-ritual-banner.png"
  },
  {
    id: 5,
    title: "Believe in BizarreBeasts! 💎",
    description: "\"Believe\" in BizarreBeasts ($BB) on @productclank",
    actionText: "Believe Now",
    actionUrl: "https://farcaster.xyz/miniapps/X_DQ70cYHoX0/productclank",
    image: "/assets/page-assets/banners/rituals-boxes/productclank-ritual-banner.png"
  },
  {
    id: 6,
    title: "Play BizarreBeasts games! 🕹️",
    description: "Play BizarreBeasts games powered by /remix",
    actionText: "Play Games",
    actionUrl: "/games",
    image: "/assets/page-assets/banners/rituals-boxes/games-ritual-banner.png"
  },
  {
    id: 7,
    title: "Rip a pack of cards! 🃏",
    description: "Rip a pack of BizarreBeasts ($BBCP) cards on @vibemarket",
    actionText: "Rip Pack",
    actionUrl: "https://farcaster.xyz/~/compose?text=Grab%20your%20BizarreBeasts%20(%24BBCP)%20packs%20on%20%40vibemarket%20%E2%99%A6%EF%B8%8F&embeds[]=https%3A%2F%2Fvibechain.com%2Fmarket%2Fbizarrebeasts%3Fref%3DBJT4EJBY0SJP",
    image: "/assets/page-assets/banners/rituals-boxes/rip-cards-ritual-banner.png"
  },
  {
    id: 8,
    title: "Buy 1M $BB Tokens! 💰",
    description: "Grow your BizarreBeasts ($BB) bag and increase your rank on the empire leaderboard",
    actionText: "Buy $BB",
    actionUrl: "/swap",
    image: "/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png"
  },
  {
    id: 9,
    title: "Share your Leaderboard rank! 🏆",
    description: "Show off your BizarreBeasts leaderboard rank and tier to the community, powered by $GLANKER!",
    actionText: "Check & Share",
    actionUrl: "/empire",
    image: "/assets/page-assets/banners/rituals-boxes/leaderboard-rank-rituals-bannker.png"
  }
];

interface FeaturedRitual {
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  image: string;
  expiresAt?: string; // Optional expiration date
}

// Featured ritual - can be easily updated or removed
const featuredRitual: FeaturedRitual | null = {
  title: "Vote for BizarreBeasts for the DCP Base Creators Award! 🏆",
  description: `There's less than 48 hours left to vote for BizarreBeasts ($BB) to receive the DCP Onchain Creators Award from @dcpfoundation! 🤯

This is a huge opportunity to bring BizarreBeasts to life as animated shorts, with potential funding and exposure from @dcpfoundation and @zora.

We are up to 171 votes, and YOUR VOTE is absolutely crucial and makes a direct impact for the BIZARRE future!

❓Have questions about the BizarreBeasts submission or voting process? Check out the @paragraph article for more details and screenshots!`,
  actionText: "Vote Now on DCP",
  actionUrl: "https://app.decentralized.pictures/project/68694bbba0073d7cf1048a2b",
  image: "/assets/page-assets/banners/rituals-boxes/featured-ritual-banner.png",
  expiresAt: "2025-01-13" // Optional: auto-hide after this date
};

export default function RitualsPage() {
  // Track featured ritual completion separately
  const [featuredCompleted, setFeaturedCompleted] = useState<boolean>(false);
  
  // Try to load from localStorage on mount, with daily reset
  const [completedRituals, setCompletedRituals] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('bizarreRitualsData');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Check if it's a new day - if so, reset
        if (data.date === today) {
          console.log('Loading rituals from today');
          return new Set(data.rituals);
        } else {
          console.log('New day detected - resetting rituals');
          // It's a new day, start fresh
          return new Set();
        }
      }
    } catch (e) {
      console.log('Could not load rituals from localStorage:', e);
    }
    return new Set();
  });

  // Save to localStorage whenever rituals change, with date
  useEffect(() => {
    try {
      const data = {
        rituals: Array.from(completedRituals),
        date: new Date().toDateString() // Save today's date
      };
      localStorage.setItem('bizarreRitualsData', JSON.stringify(data));
    } catch (e) {
      console.log('Could not save rituals to localStorage:', e);
    }
  }, [completedRituals]);

  const handleRitualAction = (ritual: Ritual) => {
    console.log('Ritual action clicked:', ritual.title);
    
    // Mark as completed (now persists to localStorage)
    setCompletedRituals(prev => new Set([...prev, ritual.id]));
    
    // For internal routes, prepend the full URL
    const url = ritual.actionUrl.startsWith('/') 
      ? `${window.location.origin}${ritual.actionUrl}`
      : ritual.actionUrl;
    
    console.log('Opening URL:', url);
    
    // Always open in new tab
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const completedCount = completedRituals.size;
    
    // Get the names of completed rituals (without emojis for cleaner share text)
    const completedRitualsList = rituals
      .filter(r => completedRituals.has(r.id))
      .map(r => {
        // Remove emojis from title for the list
        const cleanTitle = r.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        return `✅ ${cleanTitle}`;
      })
      .join('\n');
    
    const shareText = `I've completed ${completedCount} of 9 Daily BIZARRE Rituals! 👹\n\n${completedRitualsList}\n\nJoin me in the BizarreBeasts ($BB) Community and complete your daily $BIZARRE rituals!\n\n#BizarreBeasts #BBRituals`;
    
    // Build URL with embeds[] parameter for proper link preview
    const params = new URLSearchParams();
    params.append('text', shareText);
    params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals');
    
    
    // Check if we're in Farcaster miniapp and use SDK if available
    try {
      const isInMiniApp = await sdk.isInMiniApp();
      
      if (isInMiniApp) {
        // Use SDK for native sharing in Farcaster (works on mobile!)
        await ultimateShare({
          text: shareText,
          embeds: ['https://bbapp.bizarrebeasts.io/rituals'],
          channelKey: 'bizarrebeasts'
        });
      } else {
        // Browser fallback
        params.append('channelKey', 'bizarrebeasts');
        const shareUrl = `https://warpcast.com/~/compose?${params.toString()}`;
        window.open(shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback
      params.append('channelKey', 'bizarrebeasts');
      const shareUrl = `https://warpcast.com/~/compose?${params.toString()}`;
      window.open(shareUrl, '_blank');
    }
  };

  const handleShareRitual = async (ritual: Ritual) => {
    console.log('Share ritual clicked:', ritual.title);
    
    // Build the action URL (same logic as handleRitualAction)
    let actionUrl = ritual.actionUrl.startsWith('/') 
      ? `https://bbapp.bizarrebeasts.io${ritual.actionUrl}`
      : ritual.actionUrl;
    
    // Clean text without URLs (Farcaster will add them as embeds)
    const shareText = `Daily BIZARRE Ritual #${ritual.id}: ${ritual.title}\n\n${ritual.description}\n\nJoin me in completing daily $BIZARRE rituals in the BizarreBeasts ($BB) Community! 👹\n\n#BizarreBeasts #BBRituals`;
    
    // Build URL with embeds[] parameters for proper link previews
    const baseUrl = 'https://warpcast.com/~/compose';
    const params = new URLSearchParams();
    params.append('text', shareText);
    
    // Handle special cases for embed URLs
    if (ritual.id === 3) {
      // BRND Podium - use the direct brnd.land URL for the embed
      params.append('embeds[]', 'https://brnd.land');
      params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals');
    } else if (ritual.id === 4) {
      // Create GIVE - add the coordinape link as embed
      params.append('embeds[]', 'https://dir.coordinape.com/creators/bizarrebeasts.base.eth');
      params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals');
    } else if (ritual.id === 1 || ritual.id === 6 || ritual.id === 8) {
      // Meme Generator, Games, Swap - these are on our site, only add the specific page URL
      params.append('embeds[]', actionUrl);
      // Don't add the main rituals page for these (avoid duplicate)
    } else if (!actionUrl.includes('~/compose')) {
      // For other rituals (Dexscreener, Believe), add both URLs
      params.append('embeds[]', actionUrl);
      params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals');
    } else {
      // For compose URLs (like rip pack), just add the rituals page
      params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals');
    }
    
    
    // Build embeds array for SDK
    const embeds: string[] = [];
    params.getAll('embeds[]').forEach(embed => embeds.push(embed));
    
    // Check if we're in Farcaster miniapp and use SDK if available
    try {
      const isInMiniApp = await sdk.isInMiniApp();
      
      if (isInMiniApp) {
        console.log('Using SDK for native sharing');
        // Use SDK for native sharing in Farcaster (works on mobile!)
        await ultimateShare({
          text: shareText,
          embeds: embeds,
          channelKey: 'bizarrebeasts'
        });
      } else {
        // Browser fallback
        console.log('Using browser fallback');
        params.append('channelKey', 'bizarrebeasts');
        const shareUrl = `${baseUrl}?${params.toString()}`;
        window.open(shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback
      params.append('channelKey', 'bizarrebeasts');
      const shareUrl = `${baseUrl}?${params.toString()}`;
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-12 flex justify-center">
          <img 
            src="/assets/page-assets/banners/daily-bizarre-rituals-banner.png" 
            alt="Daily BIZARRE Rituals - Complete your daily tasks in the BizarreBeasts ecosystem"
            className="w-full max-w-4xl object-contain rounded-2xl"
          />
        </div>

        {/* Featured Ritual */}
        {featuredRitual && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/10 border-2 border-gem-gold rounded-2xl overflow-hidden shadow-xl hover:shadow-gem-gold/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gem-gold/30 to-gem-crystal/30 px-6 py-2">
                <h2 className="text-lg font-bold flex items-center justify-center gap-2 text-center">
                  <span className="text-xl">⭐</span>
                  FEATURED RITUAL
                  <span className="text-xl">⭐</span>
                </h2>
              </div>
              
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden flex-shrink-0">
                  <img 
                    src={featuredRitual.image} 
                    alt={featuredRitual.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-icon w-full h-full flex items-center justify-center';
                        fallback.innerHTML = '<span class="text-4xl opacity-50">🏆</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {featuredCompleted && (
                    <div className="absolute inset-0 bg-gem-gold/20 flex items-center justify-center">
                      <Check className="w-12 h-12 text-gem-gold" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 md:p-5">
                  <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent flex items-center justify-center gap-2 text-center">
                    {featuredRitual.title}
                    {featuredCompleted && (
                      <Check className="w-5 h-5 text-gem-gold inline" />
                    )}
                  </h3>
                  
                  <div className="text-gray-300 mb-3 text-xs leading-relaxed line-clamp-2 md:line-clamp-none">
                    {featuredRitual.description.split('\n\n')[0]} {/* Show just first paragraph */}
                    <span className="text-gray-400"> • Less than 48 hours left!</span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setFeaturedCompleted(true);
                        window.open(featuredRitual.actionUrl, '_blank');
                      }}
                      className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 transform ${
                        featuredCompleted
                          ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                          : 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg hover:scale-105 hover:shadow-lg'
                      }`}
                    >
                      {featuredCompleted ? (
                        <>
                          <Check className="w-3 h-3" />
                          Voted
                        </>
                      ) : (
                        <>
                          {featuredRitual.actionText}
                          <ExternalLink className="w-3 h-3" />
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => window.open('https://paragraph.com/@bizarrebeasts/bizarrebeasts-applies-for-dcps-onchain-creators-award', '_blank')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 bg-dark-card border border-gem-crystal/50 text-gem-crystal hover:bg-gem-crystal/20"
                    >
                      Learn More
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => {
                        const shareText = `🚨 FEATURED RITUAL ALERT! 🚨\n\nVote for BizarreBeasts for the DCP @dcpfoundation Base Creators Award! 🏆\n\nLess than 48 hours left to support BizarreBeasts ($BB) for potential funding and exposure from @dcpfoundation and @zora!\n\nYour vote makes a direct impact for the BIZARRE future! 👹\n\n#BizarreBeasts #BBRituals #BBFeaturedRitual`;
                        const params = new URLSearchParams();
                        params.append('text', shareText);
                        params.append('embeds[]', featuredRitual.actionUrl); // DCP project page
                        params.append('embeds[]', 'https://bbapp.bizarrebeasts.io/rituals'); // BB rituals page
                        window.open(`https://warpcast.com/~/compose?${params.toString()}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 bg-dark-card border border-gem-gold/50 text-gem-gold hover:bg-gem-gold/20"
                    >
                      <Share className="w-3 h-3" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Description */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-300 mb-4">
            Complete your daily BIZARRE Rituals to engage with the BizarreBeasts ($BB) ecosystem! 
            Each ritual helps you explore different aspects of our community and helps you GO BIZARRE.
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink p-[1px] rounded-lg">
            <div className="bg-dark-bg rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-bold text-xl">{completedRituals.size}</span>
              <span className="text-gray-400">of</span>
              <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-bold text-xl">9</span>
              <span className="text-gray-400">Rituals Complete</span>
            </div>
          </div>
        </div>

        {/* Rituals List */}
        <div className="space-y-6">
          {rituals.map((ritual, index) => {
            const isCompleted = completedRituals.has(ritual.id);
            
            // Ordered color rotation: crystal -> gold -> pink -> repeat
            const colorOrder = [
              { border: 'border-gem-crystal/20 hover:shadow-gem-crystal/20', bg: 'to-gem-crystal/5' },
              { border: 'border-gem-gold/20 hover:shadow-gem-gold/20', bg: 'to-gem-gold/5' },
              { border: 'border-gem-pink/20 hover:shadow-gem-pink/20', bg: 'to-gem-pink/5' }
            ];
            const colorScheme = colorOrder[index % 3];
            const borderStyle = colorScheme.border;
            const bgGradient = colorScheme.bg;
            
            return (
              <div
                key={ritual.id}
                className={`bg-gradient-to-br from-dark-card via-dark-card ${bgGradient} border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isCompleted 
                    ? 'border-gem-gold/40 shadow-gem-gold/10 shadow-lg' 
                    : borderStyle
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    <img 
                      src={ritual.image} 
                      alt={ritual.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-icon w-full h-full flex items-center justify-center';
                          fallback.innerHTML = '<span class="text-4xl opacity-50">🦾</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-gem-gold/20 flex items-center justify-center">
                        <Check className="w-12 h-12 text-gem-gold" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Number Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          isCompleted 
                            ? 'bg-gem-gold/20 text-gem-gold border-2 border-gem-gold/40' 
                            : 'bg-gradient-to-r from-gem-crystal/20 to-gem-pink/20 text-gem-crystal border-2 border-gem-crystal/30'
                        }`}>
                          {ritual.id}
                        </div>
                      </div>
                      {/* Title */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2 flex-wrap">
                          {ritual.title}
                          {isCompleted && (
                            <Check className="w-5 h-5 text-gem-gold" />
                          )}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{ritual.description}</p>
                    
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleRitualAction(ritual)}
                        className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                            : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg hover:shadow-lg transform hover:scale-105'
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
                      
                      <button
                        onClick={() => handleShareRitual(ritual)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-dark-card border border-gray-700 text-gray-300 hover:border-gem-crystal/50 hover:text-gem-crystal"
                        title="Share this ritual on Farcaster"
                      >
                        <Share className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Share Section */}
        {completedRituals.size > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                {completedRituals.size === 9 
                  ? "🏆 All Rituals Complete!" 
                  : `👹 ${completedRituals.size} Ritual${completedRituals.size > 1 ? 's' : ''} Complete!`}
              </h2>
              <p className="text-gray-300 mb-6">
                {completedRituals.size === 9
                  ? "You've completed all BIZARRE Rituals! Share your achievement with the community!"
                  : "Great progress! Share your ritual journey with the BizarreBeasts community!"}
              </p>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <Share2 className="w-5 h-5" />
                Share Your Progress
              </button>
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