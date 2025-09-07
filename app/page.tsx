import Link from 'next/link';
import { Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome to BizarreBeasts
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Create memes, play games, and join the most bizarre community in Web3
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">$BB</div>
              <div className="text-sm text-gray-400">Token</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-400">1000+</div>
              <div className="text-sm text-gray-400">Holders</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">5</div>
              <div className="text-sm text-gray-400">Games</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/meme-generator"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Palette className="w-5 h-5" />
              Create Meme
            </Link>
            <Link
              href="/games"
              className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
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
              <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition cursor-pointer">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Meme Generator</h3>
                <p className="text-gray-400">
                  Create hilarious memes with our collection of BizarreBeasts stickers and backgrounds
                </p>
              </div>
            </Link>

            {/* Games Hub */}
            <Link href="/games" className="group">
              <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition cursor-pointer">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Gamepad2 className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Games Hub</h3>
                <p className="text-gray-400">
                  Access all BizarreBeasts games across Telegram, World App, and more
                </p>
              </div>
            </Link>

            {/* Leaderboard */}
            <Link href="/leaderboard" className="group">
              <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition cursor-pointer">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
                <p className="text-gray-400">
                  Check your ranking and compete with the community
                </p>
              </div>
            </Link>

            {/* Token Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">$BB Token</h3>
              <p className="text-gray-400">
                Track price, volume, and holder stats in real-time
              </p>
            </div>

            {/* Community */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-400">
                Join contests, earn rewards, and connect with fellow beasts
              </p>
            </div>

            {/* Coming Soon */}
            <div className="bg-gray-800 rounded-lg p-6 opacity-60">
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
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">🏆 Meme Contest Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              Get ready to showcase your creativity and win amazing prizes!
            </p>
            <Link
              href="/meme-generator"
              className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}