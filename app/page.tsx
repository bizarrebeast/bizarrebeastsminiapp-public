'use client';

import Link from 'next/link';
import { Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles, ArrowDownUp } from 'lucide-react';
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
              src="/assets/page-assets/banners/bizarrebeasts-homepage-banner-bb-token.svg" 
              alt="BizarreBeasts Banner" 
              className="w-full max-w-4xl object-contain rounded-2xl"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">
            Welcome to BizarreBeasts
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            GO BIZARRE! Create memes, play games, swap tokens, and join the most BIZARRE community in web3!
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <Link href="/swap" className="bg-dark-card border border-gem-gold/20 rounded-lg p-4 transition-all duration-300 hover:border-gem-gold/40 hover:scale-105 cursor-pointer">
              <div className="text-2xl font-bold text-gem-gold">$BB</div>
              <div className="text-sm text-gray-400">Token</div>
            </Link>
            <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">{marketCap}</div>
              <div className="text-sm text-gray-400">Market Cap</div>
            </div>
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold text-gem-crystal">4400+</div>
              <div className="text-sm text-gray-400">Holders</div>
            </div>
            <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold text-gem-blue">8</div>
              <div className="text-sm text-gray-400">Games</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/meme-generator"
              className="bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Palette className="w-5 h-5" />
              Stickers & Meme Creator
            </Link>
            <Link
              href="/games"
              className="bg-gradient-to-r from-gem-crystal to-gem-gold text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              Play Games
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Meme Generator */}
            <Link href="/meme-generator" className="group">
              <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 hover:border-gem-crystal/40 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gem-crystal/20 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-gem-crystal" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Meme Generator</h3>
                <p className="text-gray-400">
                  Create hilarious memes with our collection of BizarreBeasts stickers and backgrounds
                </p>
              </div>
            </Link>

            {/* Games Hub */}
            <Link href="/games" className="group">
              <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-6 hover:border-gem-gold/40 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gem-gold/20 rounded-lg flex items-center justify-center mb-4">
                  <Gamepad2 className="w-6 h-6 text-gem-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Games Hub</h3>
                <p className="text-gray-400">
                  Access all BizarreBeasts games across Telegram, World App, and more
                </p>
              </div>
            </Link>

            {/* Empire Rankings */}
            <Link href="/empire" className="group">
              <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-6 hover:border-gem-blue/40 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gem-blue/20 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-gem-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Empire Rankings</h3>
                <p className="text-gray-400">
                  Check your Empire rank, boosters and climb the leaderboard
                </p>
              </div>
            </Link>

            {/* Token Swap */}
            <Link href="/swap" className="group">
              <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-6 hover:border-gem-purple/40 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gem-purple/20 rounded-lg flex items-center justify-center mb-4">
                  <ArrowDownUp className="w-6 h-6 text-gem-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Token Swap</h3>
                <p className="text-gray-400">
                  Swap $BB and other tokens directly in the app
                </p>
              </div>
            </Link>

            {/* Community */}
            <div className="bg-dark-card border border-gem-pink/20 rounded-lg p-6 hover:border-gem-pink/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gem-pink/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-gem-pink" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-400">
                Join contests, earn rewards, and connect with fellow beasts
              </p>
            </div>

            {/* Coming Soon */}
            <div className="bg-dark-card border border-dark-border rounded-lg p-6 opacity-60">
              <div className="w-12 h-12 bg-gray-600/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">More Coming</h3>
              <p className="text-gray-400">
                Token swap, check-in system, and more features coming soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contest Banner */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 rounded-lg p-8 text-center border border-gem-crystal/30">
            <h2 className="text-2xl font-bold mb-4">🏆 Meme Contest Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              Get ready to showcase your creativity and win amazing prizes!
            </p>
            <Link
              href="/meme-generator"
              className="inline-block bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}