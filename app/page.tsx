'use client';

import Link from 'next/link';
import { Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles, ArrowDownUp, Music, ExternalLink, FileText, Coins, ChevronDown, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { contestQueries, ActiveContestView } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';

export default function Home() {
  const [marketCap, setMarketCap] = useState<string>('--');
  const [showEcosystemTokens, setShowEcosystemTokens] = useState(false);
  const [activeContests, setActiveContests] = useState<ActiveContestView[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);

  useEffect(() => {
    // Fetch active contests
    const fetchContests = async () => {
      try {
        setLoadingContests(true);
        const active = await contestQueries.getActiveContestsWithStats();
        setActiveContests(active?.slice(0, 3) || []); // Show top 3 contests
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setLoadingContests(false);
      }
    };
    fetchContests();

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
      <section className="relative px-4 pt-8 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Banner above title */}
          <div className="flex justify-center mb-6">
            <img
              src="/assets/page-assets/banners/new-home-page-banner-bizarrebeasts.svg"
              alt="BizarreBeasts Banner"
              className="w-full max-w-4xl object-contain"
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
            {activeContests.length > 0 && (
              <Link
                href="/contests"
                className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Enter Contests
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* About BizarreBeasts Section */}
      <section className="px-4 pb-8">
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
      <section className="px-4 py-8">
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

            {/* Contests */}
            <Link href="/contests" className="group">
              <div
                className="relative rounded-lg overflow-hidden h-full flex items-end transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundImage: 'url(/assets/page-assets/banners/feature-boxes/contests-feature-box.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '200px',
                  backgroundColor: '#1a0d26' // Fallback color
                }}
              >
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/30"></div>

                {/* Active contest indicator */}
                {activeContests.length > 0 && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-gem-crystal/90 text-dark-bg rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-dark-bg rounded-full animate-pulse"></span>
                    {activeContests.length} ACTIVE
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent drop-shadow-lg">Contests & Prizes</h3>
                  <p className="text-white font-medium drop-shadow-md">
                    Compete in challenges and win $BB tokens and NFT prizes
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Active Contests Section */}
      {activeContests.length > 0 && (
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              🏆 Active Contests
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {activeContests.map((contest) => (
                <Link key={contest.id} href={`/contests/${contest.id}`}>
                  <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden hover:border-gem-crystal/40 transition cursor-pointer">
                    {/* Banner Image */}
                    {contest.banner_image_url ? (
                      <div className="relative w-full h-48 bg-gradient-to-br from-gem-crystal/20 to-gem-purple/20">
                        <img
                          src={contest.banner_image_url}
                          alt={contest.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load banner image:', contest.banner_image_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-gradient-to-br from-gem-crystal/20 to-gem-purple/20 flex items-center justify-center">
                        <span className="text-6xl opacity-50">
                          {contest.type === 'game_score' ? '🎮' :
                           contest.type === 'creative' ? '🎨' :
                           contest.type === 'onboarding' ? '🚀' : '🏆'}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                      {contest.end_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const end = new Date(contest.end_date);
                              const now = new Date();
                              const diff = end.getTime() - now.getTime();
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              if (days > 0) return `${days}d left`;
                              if (hours > 0) return `${hours}h left`;
                              return 'Ending soon';
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                      <h3 className="text-lg font-bold mb-2 text-white">{contest.name}</h3>
                      {contest.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{contest.description}</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{contest.participant_count || 0} entries</span>
                        </div>
                        {contest.prize_amount && (
                          <div className="flex items-center gap-1 text-gem-gold">
                            <Coins className="w-3 h-3" />
                            <span>{formatTokenBalance(contest.prize_amount.toString())} $BB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/contests"
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition"
              >
                <Trophy className="w-5 h-5" />
                View All Contests
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Game Banner - Treasure Quest */}
      <section className="px-4 py-8">
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

      {/* Contract Information Section */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-yellow-400 rounded-lg">
                <FileText className="w-6 h-6 text-dark-bg" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent">
                Token Ecosystem & Contracts
              </h2>
            </div>

            {/* Main $BB Token */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-gem-gold" />
                BizarreBeasts ($BB) Token
              </h3>
              <div className="bg-dark-bg/50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-gray-400 text-sm">Contract Address:</span>
                  <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                    0x0520bf1d3cEE163407aDA79109333aB1599b4004
                  </code>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://basescan.org/token/0x0520bf1d3cEE163407aDA79109333aB1599b4004"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-purple to-gem-blue text-white text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    BaseScan
                  </a>
                  <a
                    href="https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    DexScreener
                  </a>
                  <a
                    href="https://app.uniswap.org/swap?outputCurrency=0x0520bf1d3cEE163407aDA79109333aB1599b4004&chain=base"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Uniswap
                  </a>
                </div>
              </div>
            </div>

            {/* Smart Contracts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gem-purple" />
                Smart Contracts
              </h3>
              <div className="bg-dark-bg/50 rounded-lg p-4 space-y-4">
                <div>
                  <div className="font-semibold text-white mb-2">BizarreCheckIn Contract</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="text-gray-400 text-sm">Address:</span>
                    <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                      0x12125F025ea390B975aEa210B40c7B81dC2F00E0
                    </code>
                  </div>
                  <a
                    href="https://basescan.org/address/0x12125F025ea390B975aEa210B40c7B81dC2F00E0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 text-gem-crystal hover:text-gem-gold text-sm transition-colors"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Ecosystem Tokens Dropdown */}
            <div>
              <button
                onClick={() => setShowEcosystemTokens(!showEcosystemTokens)}
                className="flex items-center gap-2 text-lg font-bold text-white mb-4 hover:text-gem-crystal transition-colors"
              >
                <Sparkles className="w-5 h-5 text-gem-crystal" />
                Ecosystem Tokens
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showEcosystemTokens ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showEcosystemTokens && (
                <div className="bg-dark-bg/50 rounded-lg p-4 space-y-4 animate-fadeIn">
                  {/* Zora Creator Coin */}
                  <div className="border-b border-gem-crystal/10 pb-4">
                    <div className="font-semibold text-white mb-2">BizarreBeasts Zora Creator Coin</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <span className="text-gray-400 text-sm">Contract:</span>
                      <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                        0x409a3041a005b0e1b4a9e8bb397a988228e05c2d
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://zora.co/@bizarrebeasts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        Zora Profile <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://basescan.org/address/0x409a3041a005b0e1b4a9e8bb397a988228e05c2d"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        BaseScan <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://dexscreener.com/base/0xffb35712fae7648592ca57293bc910a21a55a9780d7b40c46087137d0b9039af"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-600/30 transition-colors"
                      >
                        DexScreener <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* CURA Channel Token */}
                  <div className="border-b border-gem-crystal/10 pb-4">
                    <div className="font-semibold text-white mb-2">$BIZARRE - CURA Channel Token</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <span className="text-gray-400 text-sm">Token Contract:</span>
                      <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                        0x3733D96361829911C1A5080e6F5095774B12D628
                      </code>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <span className="text-gray-400 text-sm">Claim Contract:</span>
                      <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                        0x7d0436582a5b0341a4335d5d9818978ade808980
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://cura.network/bizarrebeasts/token"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 text-xs rounded-lg hover:bg-purple-600/30 transition-colors"
                      >
                        CURA Network <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://dexscreener.com/base/0x3733D96361829911C1A5080e6F5095774B12D628"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-600/30 transition-colors"
                      >
                        DexScreener <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://basescan.org/address/0x7d0436582a5b0341a4335d5d9818978ade808980"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        Claim Contract <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Retake.tv Token */}
                  <div className="border-b border-gem-crystal/10 pb-4">
                    <div className="font-semibold text-white mb-2">BIZARREBEAST - Retake.tv Token</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <span className="text-gray-400 text-sm">Contract:</span>
                      <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                        0xd86dba76a95305539ba3b6628ef1476e70f99b07
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://basescan.org/token/0xd86dba76a95305539ba3b6628ef1476e70f99b07"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        BaseScan <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://retake.tv/live/357897"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 text-xs rounded-lg hover:bg-green-600/30 transition-colors"
                      >
                        Retake.tv <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600/20 text-gray-400 text-xs rounded-lg">
                        DEX Coming Soon
                      </span>
                    </div>
                  </div>

                  {/* Placeholder for future tokens */}
                  <div className="text-gray-500 text-sm italic pt-2">
                    More ecosystem tokens coming soon
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contest Banner */}
      <section className="px-4 py-8">
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