'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Check, Share2 } from 'lucide-react';

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
    image: "/assets/page-assets/banners/stickers-meme-creator-banner.png"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener! 🔥",
    description: "Support $BB on Dexscreener by hitting \"🚀\" and \"🔥\"!",
    actionText: "Open Dexscreener",
    actionUrl: "https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2",
    image: "/assets/page-assets/banners/token-swap-bb-chart-banner.png"
  },
  {
    id: 3,
    title: "Create your $BRND podium! 🏆",
    description: "Create your @brnd podium with $BB in 🥇 and share!",
    actionText: "Create Podium",
    actionUrl: "https://brnd.land",
    image: "/assets/page-assets/banners/empire-leaderboard-banner.png"
  },
  {
    id: 4,
    title: "Send a #create GIVE! 🎨",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator's Directory!",
    actionText: "Send GIVE",
    actionUrl: "https://dir.coordinape.com/creators/bizarrebeasts.base.eth",
    image: "/assets/page-assets/banners/community-resources-banner.png"
  },
  {
    id: 5,
    title: "Believe in BizarreBeasts! 💎",
    description: "\"Believe\" in BizarreBeasts ($BB) on @productclank",
    actionText: "Believe Now",
    actionUrl: "https://farcaster.xyz/miniapps/X_DQ70cYHoX0/product-clank",
    image: "/assets/page-assets/banners/home-page-banner.png"
  },
  {
    id: 6,
    title: "Play BizarreBeasts games! 🕹️",
    description: "Play BizarreBeasts games powered by /remix",
    actionText: "Play Games",
    actionUrl: "/games",
    image: "/assets/page-assets/banners/bizarrebeasts-games-banner.png"
  },
  {
    id: 7,
    title: "Rip a pack of cards! 🃏",
    description: "Rip a pack of BizarreBeasts ($BBCP) cards on @vibemarket",
    actionText: "Rip Pack",
    actionUrl: "https://vibechain.com/market?ref=BJT4EJBY0SJP",
    image: "/assets/page-assets/games/banners/treasure-quest-game-banner-1.svg"
  },
  {
    id: 8,
    title: "Buy 1M $BB Tokens! 💰",
    description: "Grow your BizarreBeasts ($BB) bag and increase your rank on the empire leaderboard",
    actionText: "Buy $BB",
    actionUrl: "/swap",
    image: "/assets/page-assets/banners/token-swap-bb-chart-banner.png"
  }
];

export default function RitualsPage() {
  // Try to load from localStorage on mount
  const [completedRituals, setCompletedRituals] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('bizarreRituals');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (e) {
      console.log('Could not load rituals from localStorage:', e);
    }
    return new Set();
  });

  // Save to localStorage whenever rituals change
  useEffect(() => {
    try {
      localStorage.setItem('bizarreRituals', JSON.stringify(Array.from(completedRituals)));
    } catch (e) {
      console.log('Could not save rituals to localStorage:', e);
    }
  }, [completedRituals]);

  const handleRitualAction = (ritual: Ritual) => {
    // Mark as completed (now persists to localStorage)
    setCompletedRituals(prev => new Set([...prev, ritual.id]));
    
    // For internal routes, prepend the full URL
    const url = ritual.actionUrl.startsWith('/') 
      ? `${window.location.origin}${ritual.actionUrl}`
      : ritual.actionUrl;
    
    // Always open in new tab
    window.open(url, '_blank');
  };

  const handleShare = () => {
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
    
    const shareText = `I've completed ${completedCount} of 8 Daily BIZARRE Rituals! 👹\n\n${completedRitualsList}\n\nJoin me in the BizarreBeasts ($BB) Community and complete your daily $BIZARRE rituals!\n\n#BizarreBeasts #BBRituals\nhttps://bbapp.bizarrebeasts.io/rituals`;
    
    // Always use web share URL for consistency
    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
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
              <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-bold text-xl">8</span>
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
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <span className="text-gem-crystal">#{ritual.id}</span>
                        {ritual.title}
                        {isCompleted && (
                          <Check className="w-5 h-5 text-gem-gold" />
                        )}
                      </h3>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{ritual.description}</p>
                    
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
                {completedRituals.size === 8 
                  ? "🏆 All Rituals Complete!" 
                  : `👹 ${completedRituals.size} Ritual${completedRituals.size > 1 ? 's' : ''} Complete!`}
              </h2>
              <p className="text-gray-300 mb-6">
                {completedRituals.size === 8
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
          <p className="mt-2">Progress resets each session • No data is stored</p>
        </div>
      </div>
    </div>
  );
}