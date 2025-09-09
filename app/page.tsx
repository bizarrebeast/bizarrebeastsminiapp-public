'use client';

import Link from 'next/link';
import { Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles, ArrowDownUp, Music, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [marketCap, setMarketCap] = useState<string>('--');

  useEffect(() => {
    const fetchMarketCap = async () => {
      try {
        // Using DexScreener API to get BB token price data
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x0520bf1d3cEE163407aDA79109333aB1599b4004');
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Get the first pair's market cap
          const mcap = data.pairs[0].fdv || data.pairs[0].marketCap;
          if (mcap) {
            // Format market cap without decimals
            if (mcap >= 1000000) {
              setMarketCap(`$${Math.round(mcap / 1000000)}M`);
            } else if (mcap >= 1000) {
              setMarketCap(`$${Math.round(mcap / 1000)}K`);
            } else {
              setMarketCap(`$${Math.round(mcap)}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching market cap:', error);
        setMarketCap('--');
      }
    };

    fetchMarketCap();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketCap, 30000);
    
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Banner */}
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/page-assets/banners/home-page-banner.png" 
              alt="BizarreBeasts Banner" 
              className="w-full max-w-4xl object-contain rounded-2xl"
            />
          </div>
          
          {/* Welcome Title */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            BizarreBeasts ($BB) Miniapp
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Create memes, play games, swap $BB tokens, collect art, win contests, and join the most BIZARRE community in web3!
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <Link href="/swap" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-crystal/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">$BB</div>
              <div className="text-xs sm:text-sm text-gray-400">Token</div>
            </Link>
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">{marketCap}</div>
              <div className="text-xs sm:text-sm text-gray-400">Market Cap</div>
            </div>
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">4400+</div>
              <div className="text-xs sm:text-sm text-gray-400">Holders</div>
            </div>
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">8</div>
              <div className="text-xs sm:text-sm text-gray-400">Games</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/meme-generator"
              className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Palette className="w-5 h-5" />
              Stickers & Meme Creator
            </Link>
            <Link
              href="/games"
              className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              Play Games
            </Link>
          </div>
        </div>
      </section>

      {/* About BizarreBeasts Section */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl p-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/assets/page-assets/logos/bb-token.png" 
                alt="BizarreBeasts" 
                className="w-[100px] h-[100px] object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              About BizarreBeasts
            </h2>
            <div className="space-y-4 text-gray-300 text-lg">
              <p>
                BizarreBeasts is an original, art-powered ecosystem featuring hand-illustrated characters, animations, NFTs, and web3 games! With 8 games played over 130,000 times and achieving #1 trending on Remix and TheBaseApp, BizarreBeasts has built a notorious community of 4,400+ token holders GOING BIZARRE.
              </p>
              <p>
                The $BB token (powered by $GLANKER) fuels our creative universe: rewarding the community, unlocking exclusive perks, and providing access to the /bizarrebeasts Farcaster community. As a holder, climb the Empire leaderboard, earn treasury rewards, and unlock premium features!
              </p>
              <p>
                From original music and comics to interactive games and physical paintings, dive into the BIZARREBEASTS universe, where art and web3 collide!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-12 relative">
            <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              Features
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 blur-3xl -z-10"></div>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stickers & Meme Creator */}
            <Link href="/meme-generator" className="group">
              <div 
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/sticker-meme-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Stickers & Meme Creator</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Create and export memes with stickers, text overlays, and custom backgrounds
                  </p>
                </div>
              </div>
            </Link>

            {/* BizarreBeasts Games */}
            <Link href="/games" className="group">
              <div 
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/games-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">BizarreBeasts Games</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Play our collection of games with over 128K+ total plays and counting
                  </p>
                </div>
              </div>
            </Link>

            {/* Token Swap */}
            <Link href="/swap" className="group">
              <div 
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/swap-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Token Swap</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Swap $BB tokens with integrated Uniswap interface on Base
                  </p>
                </div>
              </div>
            </Link>

            {/* Empire Leaderboard */}
            <Link href="/empire" className="group">
              <div 
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/empire-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Empire Leaderboard</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Live leaderboard tracking with tiers, boosters, and multipliers
                  </p>
                </div>
              </div>
            </Link>

            {/* Game Soundtracks */}
            <Link href="/music" className="group">
              <div 
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/music-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px'
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Game Soundtracks</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Original music by @kateyarter for BizarreBeasts games
                  </p>
                </div>
              </div>
            </Link>

            {/* Community Hub */}
            <div 
              className="relative rounded-lg overflow-hidden h-full flex items-end opacity-60"
              style={{
                backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/community-feature-box.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '200px'
              }}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 p-6">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Community Hub</h3>
                <p className="text-white font-medium drop-shadow-md">
                  Contests, rewards, and social features coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Game Banner - Treasure Quest */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/10 border border-gem-gold/30 rounded-2xl overflow-hidden hover:border-gem-gold/50 transition-all duration-300">
            <div className="relative">
              <img 
                src="/assets/page-assets/banners/treasure-quest-banner.png" 
                alt="BizarreBeasts Treasure Quest"
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-4 right-4 bg-gem-gold/90 text-dark-bg px-3 py-1 rounded-full text-sm font-bold">
                FEATURED GAME
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col gap-6">
                {/* Game Title and Description */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    BizarreBeasts: Treasure Quest
                  </h2>
                  
                  <p className="text-gray-300 mb-3 text-base sm:text-lg">
                    Climb endless crystal caverns as BizBe in this retro arcade platformer! Jump on enemies, collect gems, and discover treasure chests through 5 chapters and 50+ levels. Journey through Crystal Caverns, Volcanic, Steampunk, Electrified, and Galactic Crystal Caverns, then face endless BEAST MODE with progressive difficulty!
                  </p>
                  
                  <div className="bg-dark-bg/50 rounded-lg p-4 mb-4">
                    <p className="text-gray-400 italic text-sm sm:text-base">
                      "I poured over 300 hours into building the entire game, including all of the art, animations, and game logic, to make it as fun, BIZARRE, and creative as possible. The game includes an original character, BizBe, 9 enemies, 5 chapters with 10 levels each, bonus levels, over 70 original backgrounds, and Level 51+ becomes BEAST MODE!"
                    </p>
                    <p className="text-gem-gold text-sm mt-2">— BizarreBeast</p>
                  </div>
                </div>

                {/* Two Column Layout for Features and Guide */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Game Features */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-gem-crystal">Game Features</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gem-crystal">50+</div>
                        <div className="text-xs text-gray-400">Levels</div>
                      </div>
                      <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gem-gold">5</div>
                        <div className="text-xs text-gray-400">Chapters</div>
                      </div>
                      <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gem-pink">9</div>
                        <div className="text-xs text-gray-400">Enemies</div>
                      </div>
                      <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">∞</div>
                        <div className="text-xs text-gray-400">Beast Mode</div>
                      </div>
                    </div>
                  </div>

                  {/* Player's Guide */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-gem-gold">Player's Guide</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Your ultimate companion to navigating the BIZARRE and treasure-filled crystal caverns. Learn everything you need to become a BIZARRE treasure quester!
                    </p>
                    <a
                      href="https://paragraph.com/@bizarrebeasts/the-official-players-guide-bizarrebeasts-treasure-quest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                    >
                      Read Player's Guide
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contest Banner */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 rounded-lg p-8 text-center border border-gem-crystal/30">
            <h2 className="text-2xl font-bold mb-4">🏆 Meme Contest Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              Get ready to showcase your creativity and win amazing prizes!
            </p>
            <Link
              href="/meme-generator"
              className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}