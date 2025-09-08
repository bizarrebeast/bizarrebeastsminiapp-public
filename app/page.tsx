import Link from 'next/link';
import { Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">
            Welcome to BizarreBeasts
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Create memes, play games, and join the most BIZARRE community in web3
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold text-gem-gold">$BB</div>
              <div className="text-sm text-gray-400">Token</div>
            </div>
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold text-gem-crystal">1000+</div>
              <div className="text-sm text-gray-400">Holders</div>
            </div>
            <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-4 transition-all duration-300">
              <div className="text-2xl font-bold text-gem-blue">5</div>
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
              Create Meme
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

            {/* Token Info */}
            <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-6 hover:border-gem-purple/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gem-purple/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-gem-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">$BB Token</h3>
              <p className="text-gray-400">
                Track price, volume, and holder stats in real-time
              </p>
            </div>

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