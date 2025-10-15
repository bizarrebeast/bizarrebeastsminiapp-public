'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Trophy, TrendingUp, Users, Sparkles, Clock, Award,
  Gamepad2, Palette, ArrowUp, Flame, Zap, Star,
  ChevronRight, ChevronLeft, Timer, Gift, Target, Crown, Coins,
  Activity, CheckCircle, ArrowDownUp, Music, ExternalLink,
  FileText, ChevronDown
} from 'lucide-react';
import { contestQueries, ActiveContestView } from '@/lib/supabase';
import { useBBAuth } from '@/hooks/useBBAuth';
import { formatTokenBalance } from '@/lib/tokenBalance';
import { getTotalNFTs, getTotalHolders } from '@/lib/nft-data';
import FlipBanner from '@/components/FlipBanner';

export default function Home() {
  const [marketCap, setMarketCap] = useState<string>('--');
  const [activeContests, setActiveContests] = useState<ActiveContestView[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [livePrice, setLivePrice] = useState<string>('--');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [totalHolders, setTotalHolders] = useState<number>(5600);
  const [showAbout, setShowAbout] = useState(false);
  const [showEcosystemTokens, setShowEcosystemTokens] = useState(false);
  const [showTokenContracts, setShowTokenContracts] = useState(false);
  const [currentContestIndex, setCurrentContestIndex] = useState(0);
  const { user, empireTier, empireRank, isAuthenticated } = useBBAuth();

  // Featured NFT Collections Data
  const featuredCollections = [
    {
      id: 'bbcp-vibemarket',
      name: 'BizarreBeasts ($BBCP) VibeMarket Cards',
      bannerImage: '/assets/page-assets/banners/nft-collections-homepage-banners/bizarrebeasts-bbcp-vibecards-nft-banner.png',
      contractAddress: '0xcebff8f7db53062ade8e3f131a85283131168e59',
      supply: '1,609',
      links: [
        { label: 'View Collection', url: '/nft/collection/bbcp-vibemarket', primary: true },
        { label: 'Trade on VibeMarket', url: 'https://vibechain.com/market/bizarrebeasts?ref=BJT4EJBY0SJP&pnlId=28acae0d', primary: false }
      ]
    },
    {
      id: 'treasure-quest',
      name: 'Treasure Quest - Game Artwork',
      bannerImage: '/assets/page-assets/banners/nft-collections-homepage-banners/bizarrebeasts-bbcp-treasure-quest-banner.png',
      contractAddress: '0xB66bF0d9196D8746564C84Ece150d51F63FD74Cf',
      supply: '3',
      links: [
        { label: 'View Collection', url: '/nft/collection/treasure-quest', primary: true },
        { label: 'Play Treasure Quest', url: 'https://treasure-quest.remix.gg/', primary: false }
      ]
    },
    {
      id: 'bizarre-bounce',
      name: 'Bizarre Bounce - Game Artwork',
      bannerImage: '/assets/page-assets/banners/nft-collections-homepage-banners/bizarrebeasts-bizarre-bounce-nft-banner.png',
      contractAddress: '0x2E8FCA4B9cddDF07cE9eE0B1317A3b0d7a3A4A59',
      supply: '5',
      links: [
        { label: 'View Collection', url: '/nft/collection/bizarre-bounce', primary: true },
        { label: 'Play Bizarre Bounce', url: 'https://bizarre-bounce.remix.gg/', primary: false }
      ]
    }
  ];

  // Auto-scroll contests carousel
  useEffect(() => {
    if (activeContests.length > 1) {
      const interval = setInterval(() => {
        setCurrentContestIndex((prev) => (prev + 1) % activeContests.length);
      }, 5000); // Auto-scroll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeContests.length]);

  // No longer needed - using static banner images

  useEffect(() => {
    // Fetch active contests
    const fetchContests = async () => {
      try {
        setLoadingContests(true);
        const active = await contestQueries.getActiveContestsWithStats();
        console.log('Active contests fetched:', active);
        setActiveContests(active || []);
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setLoadingContests(false);
      }
    };
    fetchContests();

    // Fetch market data
    const fetchMarketData = async () => {
      try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x0520bf1d3cEE163407aDA79109333aB1599b4004');
        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          const mcap = pair.fdv || pair.marketCap;
          const price = pair.priceUsd;
          const change = pair.priceChange?.h24 || 0;

          if (mcap) {
            if (mcap >= 1000000) {
              setMarketCap(`$${(mcap / 1000000).toFixed(1)}M`);
            } else if (mcap >= 1000) {
              setMarketCap(`$${Math.round(mcap / 1000)}K`);
            } else {
              setMarketCap(`$${Math.round(mcap)}`);
            }
          }

          if (price) {
            setLivePrice(`$${parseFloat(price).toFixed(8)}`);
          }

          setPriceChange(change);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);

    // Note: Empire leaderboard only returns top 250 holders, not total count
    // Keeping the accurate 5600+ holder count from on-chain data
    // const fetchEmpireData = async () => {
    //   try {
    //     const response = await fetch('/api/empire/leaderboard');
    //     const data = await response.json();
    //     console.log('Empire data fetched:', data);

    //     if (data.holders && data.holders.length > 0) {
    //       setTotalHolders(data.holders.length);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching Empire data:', error);
    //   }
    // };

    // fetchEmpireData();

    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return 'Ended';

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handlePrevContest = () => {
    setCurrentContestIndex((prev) =>
      prev === 0 ? activeContests.length - 1 : prev - 1
    );
  };

  const handleNextContest = () => {
    setCurrentContestIndex((prev) =>
      (prev + 1) % activeContests.length
    );
  };


  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Banner */}
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

          {/* Quick Stats with Live Data */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            <Link href="/swap" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-crystal/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">$BB</div>
              <div className="text-xs sm:text-sm text-gray-400">Token</div>
            </Link>
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">{marketCap}</div>
              <div className="text-xs sm:text-sm text-gray-400">Market Cap</div>
            </div>
            <Link href="/empire" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-pink/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                {totalHolders.toLocaleString()}+
              </div>
              <div className="text-xs sm:text-sm text-gray-400">$BB Holders</div>
            </Link>
            <Link href="/nft" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-crystal/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">{getTotalHolders().toLocaleString()}+</div>
              <div className="text-xs sm:text-sm text-gray-400">NFT Collectors</div>
            </Link>
            <Link href="https://paragraph.com/@bizarrebeasts" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-gold/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">65+</div>
              <div className="text-xs sm:text-sm text-gray-400">Articles</div>
            </Link>
            <Link href="/games" className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-pink/40 hover:scale-105 cursor-pointer">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">9</div>
              <div className="text-xs sm:text-sm text-gray-400">Games</div>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
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
            <Link
              href="/rituals"
              className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Flame className="w-5 h-5" />
              BIZARRE Rituals & Daily Checkin
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Flip Banner */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            BizBe's Daily Coin Toss
          </h2>
          <FlipBanner />
        </div>
      </section>

      {/* Featured Drops - Two Column Cards */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Featured Drops
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-4">
            {/* BizBe's Booty Shake */}
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl overflow-hidden hover:border-gem-crystal/40 hover:shadow-lg transition-all duration-300">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/nft/nfts-for-inapp-mint/treasure-quest-inapp-exclusive-bizbe-booty-shaking-animation-1.gif"
                  alt="BizBe's Booty Shake"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    LIVE
                  </div>
                  <div className="bg-gem-gold/90 text-dark-bg px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    BB ONLY
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  BizBe's Booty Shake
                </h3>
                <div className="text-sm text-gray-400 mb-3">In-App Exclusive</div>

                <p className="text-gray-300 text-sm mb-4">
                  First In-App Exclusive! Animated BizBe NFT with dynamic pricing (5M-20M BB). Limited to 500.
                </p>

                <div className="bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-gem-gold" />
                    <span className="text-xs font-semibold text-gem-gold">Proceeds</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    100% of proceeds used to fund community rewards, treasury drops, and token burns
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-crystal">500</div>
                    <div className="text-xs text-gray-400">Supply</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-gold">5</div>
                    <div className="text-xs text-gray-400">Max/Wallet</div>
                  </div>
                </div>

                <Link
                  href="/nft/mint/in-app-exclusive"
                  className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  Mint Now →
                </Link>
              </div>
            </div>

            {/* DGEN1 Claim */}
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-2xl overflow-hidden hover:border-gem-gold/40 hover:shadow-lg transition-all duration-300">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/nft/dgen1-claim-art.png"
                  alt="DGEN1 Exclusive Genesis"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="bg-gem-gold/90 text-dark-bg px-2 py-1 rounded-full text-xs font-bold">
                    UPCOMING
                  </div>
                  <div className="bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    DGEN1 ONLY
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  dGEN1 Exclusive NFT
                </h3>
                <div className="text-sm text-gray-400 mb-3">Device Holders Can Claim In-App</div>

                <p className="text-gray-300 text-sm mb-4">
                  First miniapp-exclusive NFT drop! Only DGEN1 holders can claim. Hand-drawn original artwork with unique utilities.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Holder Exclusive</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    Must hold DGEN1 NFT to claim.{' '}
                    <a
                      href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gem-crystal hover:text-gem-gold transition-colors"
                    >
                      Learn more →
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-crystal">TBD</div>
                    <div className="text-xs text-gray-400">Supply</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-gold">1</div>
                    <div className="text-xs text-gray-400">Per Holder</div>
                  </div>
                </div>

                <Link
                  href="/dgen1-claim"
                  className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  View Claim Page →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured NFT Collections Grid */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Featured NFT Collections
          </h2>

          {/* Grid of Collections */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {featuredCollections.map((collection, index) => (
              <a
                key={collection.id}
                href={collection.links[0].url}
                target={collection.links[0].url.startsWith('http') ? '_blank' : undefined}
                rel={collection.links[0].url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="block"
              >
                <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-xl overflow-hidden hover:border-gem-crystal/40 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full">
                  {/* Collection Image - Large Focus */}
                  <div className="relative w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={collection.bannerImage}
                      alt={collection.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                      style={{ transformOrigin: 'top center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Minimal Content */}
                  <div className="p-4 flex-shrink-0">
                    <h4 className="text-lg font-bold group-hover:text-gem-crystal transition-colors mb-1">
                      {collection.name}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{collection.supply} Items</span>
                      <ExternalLink className="w-4 h-4 text-gem-crystal group-hover:text-gem-gold transition-colors" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/nft"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition"
            >
              <Palette className="w-5 h-5" />
              View All NFT Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Active Contests Carousel */}
      {activeContests.length > 0 && !loadingContests && (
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              🏆 Active Contests
            </h2>

            <div className="relative">
              {/* Carousel Container */}
              <div className="relative overflow-hidden bg-gradient-to-br from-dark-card via-dark-card/95 to-gem-gold/10 rounded-2xl border border-gem-gold/30">
                {/* Navigation Buttons - positioned on banner area */}
                {activeContests.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevContest}
                      className="absolute left-4 top-32 sm:top-32 z-20 p-2 bg-dark-card/90 border border-gem-crystal/30 rounded-full hover:bg-dark-card hover:border-gem-crystal/50 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gem-crystal" />
                    </button>
                    <button
                      onClick={handleNextContest}
                      className="absolute right-4 top-32 sm:top-32 z-20 p-2 bg-dark-card/90 border border-gem-crystal/30 rounded-full hover:bg-dark-card hover:border-gem-crystal/50 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gem-crystal" />
                    </button>
                  </>
                )}

                {/* Contest Display */}
                {activeContests[currentContestIndex] && (
                  <Link href={`/contests/${activeContests[currentContestIndex].id}`}>
                    <div className="relative">
                      {/* Contest Banner */}
                      {activeContests[currentContestIndex].banner_image_url ? (
                        <div className="w-full h-48 sm:h-64 relative overflow-hidden">
                          <img
                            src={activeContests[currentContestIndex].banner_image_url}
                            alt={activeContests[currentContestIndex].name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/50 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-gem-crystal/20 to-gem-purple/20 flex items-center justify-center">
                          <Trophy className="w-24 h-24 text-gem-gold opacity-50" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative p-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 h-8">
                              <Trophy className="w-5 h-5 text-gem-gold" />
                              <span className="text-xs font-bold text-gem-gold uppercase tracking-wider">Contest #{currentContestIndex + 1} of {activeContests.length}</span>
                              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                                <Timer className="w-3 h-3 text-red-400" />
                                <span className="text-xs text-red-400 font-semibold">
                                  {getTimeRemaining(activeContests[currentContestIndex].end_date || '')}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-2 line-clamp-1 h-8">{activeContests[currentContestIndex].name}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2 h-10">{activeContests[currentContestIndex].description}</p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xs text-gray-400 mb-1">Prize Pool</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                              {activeContests[currentContestIndex].prize_amount ?
                                `${formatTokenBalance(activeContests[currentContestIndex].prize_amount.toString())} $BB` :
                                'NFT'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-gray-400">Entries</p>
                              <p className="text-lg font-bold">{activeContests[currentContestIndex].participant_count || 0}</p>
                            </div>
                            {activeContests[currentContestIndex].min_bb_required > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">Min. Holding</p>
                                <p className="text-lg font-bold">{activeContests[currentContestIndex].min_bb_required} $BB</p>
                              </div>
                            )}
                          </div>
                          <div className="text-gem-crystal font-bold hover:text-gem-gold transition-colors">
                            Enter Contest →
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Carousel Indicators */}
                {activeContests.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {activeContests.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentContestIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentContestIndex ?
                          'w-8 bg-gem-crystal' :
                          'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-6">
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

      {/* Featured Game Banner - Original Full Version */}
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
                  </div>
                </div>

                {/* Action Buttons - Same Size */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <a
                    href="https://paragraph.com/@bizarrebeasts/the-official-players-guide-bizarrebeasts-treasure-quest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Read Player's Guide
                  </a>
                  <a
                    href="https://treasure-quest.remix.gg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    Play Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Ritual Section - BizarreBeasts Themed */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/10 border border-gem-gold/30 rounded-2xl overflow-hidden hover:border-gem-gold/50 transition-all duration-300">
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gem-crystal via-gem-gold to-gem-pink rounded-xl flex items-center justify-center flex-shrink-0">
                    <Flame className="w-8 h-8 text-dark-bg" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    BizarreBeasts Daily Rituals
                  </h3>
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 mb-4">
                    Join the BIZARRE ritual! Check in daily to build your streak, earn treasury rewards, and unlock exclusive features.
                    Share your rituals on Farcaster to spread the BIZARRE energy and climb the community leaderboard!
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Link
                      href="/rituals"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg rounded-lg font-bold hover:scale-105 transition-all"
                    >
                      <Flame className="w-5 h-5" />
                      Start Your BIZARRE Streak
                    </Link>
                    <div className="text-sm text-gray-400">
                      🏆 Top streakers earn bonus $BB rewards!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About BizarreBeasts Section - Collapsible */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="w-full p-6 flex items-center justify-between hover:bg-gem-crystal/5 transition-colors"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent flex items-center gap-3">
                <img
                  src="/assets/page-assets/logos/bb-token.png"
                  alt="BizarreBeasts"
                  className="w-[50px] h-[50px] object-contain"
                />
                About BizarreBeasts
              </h2>
              <ChevronDown className={`w-6 h-6 text-gem-crystal transition-transform ${showAbout ? 'rotate-180' : ''}`} />
            </button>

            {showAbout && (
              <div className="px-6 pb-6">
                <div className="space-y-4 text-gray-300 mb-6">
                  <p>
                    BizarreBeasts is an original, art-powered ecosystem featuring hand-illustrated characters, animations, NFTs, and web3 games. With 9 games played over 140,000 times—hitting #1 trending on both Remix and The Base App—I've built a notorious community of 5,600+ token holders going BIZARRE.
                  </p>
                  <p>
                    The $BB token fuels this creative universe: rewarding the community, unlocking exclusive perks, and providing access to the /bizarrebeasts Farcaster channel. As a holder, climb the Empire leaderboard, earn treasury rewards, and unlock premium features in our meme creator and contests.
                  </p>
                  <p>
                    From original music and comics to interactive games and physical paintings—dive into the BIZARRE.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    Learn More About the Creator
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contract Information Section */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTokenContracts(!showTokenContracts)}
              className="w-full p-6 flex items-center justify-between hover:bg-gem-crystal/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-teal-400 to-yellow-400 rounded-lg">
                  <FileText className="w-6 h-6 text-dark-bg" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent">
                  Token Ecosystem & Contracts
                </h2>
              </div>
              <ChevronDown className={`w-6 h-6 text-gem-crystal transition-transform ${showTokenContracts ? 'rotate-180' : ''}`} />
            </button>

            {showTokenContracts && (
              <div className="px-6 pb-6">
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
                          0x3e8B162E639785f71018DB091A13e3b5A5b77278
                        </code>
                      </div>
                      <a
                        href="https://basescan.org/address/0x3e8B162E639785f71018DB091A13e3b5A5b77278"
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
            )}
          </div>
        </div>
      </section>

    </div>
  );
}