/* SAVED FOR FUTURE IMPLEMENTATION - COMMENTED OUT FOR NOW */
/*
'use client';

import Link from 'next/link';
import {
  Palette, Gamepad2, Trophy, TrendingUp, Users, Sparkles,
  ArrowDownUp, Music, ExternalLink, Clock, CheckCircle,
  Flame, Crown, Star, Zap, Target, Gift, Activity,
  TrendingDown, Award, ChevronRight, Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock data for demonstration
const mockActivityFeed = [
  { id: 1, type: 'game', user: 'beastmode', action: 'scored 42,000 in Treasure Quest', time: '2m ago', icon: '🎮' },
  { id: 2, type: 'empire', user: 'gemhunter', action: 'climbed to Rank #25', time: '5m ago', icon: '💎' },
  { id: 3, type: 'meme', user: 'artlover', action: 'created a viral meme', time: '8m ago', icon: '🎨' },
  { id: 4, type: 'win', user: 'luckyone', action: 'won 500 $BB in daily lottery', time: '12m ago', icon: '🏆' },
  { id: 5, type: 'battle', user: 'warrior23', action: 'is battling in Beast Arena', time: '15m ago', icon: '⚔️' },
];

const mockTrendingMemes = [
  { id: 1, title: 'Moon Beast', votes: 342, creator: 'cryptoart', preview: '🌙' },
  { id: 2, title: 'GM Bizarre', votes: 289, creator: 'memester', preview: '☀️' },
  { id: 3, title: 'Hodl Forever', votes: 256, creator: 'diamond', preview: '💎' },
];

const mockLeaderboard = [
  { rank: 1, user: 'BeastMaster', score: 125420, change: 'up' },
  { rank: 2, user: 'GemHunter', score: 118350, change: 'same' },
  { rank: 3, user: 'VibeChecker', score: 115200, change: 'down' },
  { rank: 4, user: 'TreasureKing', score: 112000, change: 'up' },
  { rank: 5, user: 'CrystalQueen', score: 108500, change: 'up' },
];
*/

export default function HomeV2() {
  return (
    <div className="min-h-screen bg-dark-bg text-white p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Homepage V2 - Coming Soon</h1>
        <p className="text-gem-crystal/70">This enhanced version with dynamic features has been saved for future implementation.</p>
      </div>
    </div>
  );
}

/*
  const [marketCap, setMarketCap] = useState<string>('--');
  const [onlineUsers, setOnlineUsers] = useState(Math.floor(Math.random() * 50) + 100);
  const [treasuryValue, setTreasuryValue] = useState('$45.2K');
  const [nextDistribution, setNextDistribution] = useState('2d 14h 32m');
  const [userStreak, setUserStreak] = useState(7);
  const [dailyChallenges, setDailyChallenges] = useState([
    { id: 1, task: 'Play 3 games', progress: 1, total: 3, reward: '10 $BB' },
    { id: 2, task: 'Create 1 meme', progress: 0, total: 1, reward: 'Special Sticker' },
    { id: 3, task: 'Visit Empire', progress: 1, total: 1, reward: '2x Booster' },
  ]);

  useEffect(() => {
    const fetchMarketCap = async () => {
      try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x0520bf1d3cEE163407aDA79109333aB1599b4004');
        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
          const mcap = data.pairs[0].fdv || data.pairs[0].marketCap;
          if (mcap) {
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
    const interval = setInterval(fetchMarketCap, 30000);

    // Simulate online users changing
    const userInterval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(userInterval);
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)]">
      // Enhanced Hero Section
      <section className="relative px-4 pt-8 pb-12 text-center">
        <div className="max-w-6xl mx-auto">
          // Live Stats Bar
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-dark-card/50 px-3 py-1.5 rounded-full border border-gem-crystal/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">{onlineUsers} Online</span>
            </div>
            <div className="flex items-center gap-2 bg-dark-card/50 px-3 py-1.5 rounded-full border border-gem-gold/20">
              <TrendingUp className="w-4 h-4 text-gem-gold" />
              <span className="text-sm text-gray-300">$BB {marketCap}</span>
            </div>
            <div className="flex items-center gap-2 bg-dark-card/50 px-3 py-1.5 rounded-full border border-gem-pink/20">
              <Trophy className="w-4 h-4 text-gem-pink" />
              <span className="text-sm text-gray-300">Treasury: {treasuryValue}</span>
            </div>
            <div className="flex items-center gap-2 bg-dark-card/50 px-3 py-1.5 rounded-full border border-gem-crystal/20">
              <Clock className="w-4 h-4 text-gem-crystal" />
              <span className="text-sm text-gray-300">Next Drop: {nextDistribution}</span>
            </div>
          </div>

          // Banner
          <div className="flex justify-center mb-6">
            <img
              src="/assets/page-assets/banners/home-page-banner.png"
              alt="BizarreBeasts Banner"
              className="w-full max-w-4xl object-contain rounded-2xl"
            />
          </div>

          // Welcome Title
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Welcome to BizarreBeasts
          </h1>
        </div>
      </section>

      // Quick Actions Hub
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/rituals" className="group relative bg-gradient-to-br from-gem-crystal/20 to-gem-crystal/5 border border-gem-crystal/30 rounded-xl p-6 hover:border-gem-crystal/50 transition-all">
              <div className="absolute top-3 right-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-orange-500 font-bold">{userStreak} day streak!</span>
              </div>
              <Gift className="w-8 h-8 text-gem-crystal mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Daily Check-in</h3>
              <p className="text-sm text-gray-400">Claim your rewards</p>
              <div className="mt-3 text-xs text-gem-crystal">Next reward: 50 $BB</div>
            </Link>

            <Link href="/meme-generator" className="group relative bg-gradient-to-br from-gem-gold/20 to-gem-gold/5 border border-gem-gold/30 rounded-xl p-6 hover:border-gem-gold/50 transition-all">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">NEW</span>
              </div>
              <Target className="w-8 h-8 text-gem-gold mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Meme Contest</h3>
              <p className="text-sm text-gray-400">Win 1000 $BB</p>
              <div className="mt-3 text-xs text-gem-gold">Ends in 2d 14h</div>
            </Link>

            <Link href="/empire" className="group relative bg-gradient-to-br from-gem-pink/20 to-gem-pink/5 border border-gem-pink/30 rounded-xl p-6 hover:border-gem-pink/50 transition-all">
              <Crown className="w-8 h-8 text-gem-pink mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Your Rank: #157</h3>
              <p className="text-sm text-gray-400">4,770 $BB to next tier</p>
              <div className="mt-3 text-xs text-gem-pink">View benefits →</div>
            </Link>
          </div>
        </div>
      </section>

      // Daily Challenges
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Daily Challenges
              </h2>
              <span className="text-sm text-gray-400">Resets in 16h 42m</span>
            </div>

            <div className="space-y-3">
              {dailyChallenges.map(challenge => (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {challenge.progress === challenge.total ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>
                      )}
                      <span className="text-white">{challenge.task}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 max-w-[200px]">
                        <div
                          className="bg-gradient-to-r from-gem-crystal to-gem-gold h-2 rounded-full transition-all"
                          style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{challenge.progress}/{challenge.total}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-400">Reward</div>
                    <div className="text-sm text-gem-gold font-semibold">{challenge.reward}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      // Live Activity & Trending Grid
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          // Live Activity Feed
          <div className="lg:col-span-1 bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gem-crystal" />
              Live Activity
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {mockActivityFeed.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-dark-bg rounded transition">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="text-gem-crystal font-semibold">@{activity.user}</span>
                      <span className="text-gray-400"> {activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-sm text-gem-crystal hover:text-gem-gold transition">
              View All Activity →
            </button>
          </div>

          // Trending Memes
          <div className="bg-dark-card border border-gem-gold/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Hot Memes Today
            </h2>
            <div className="space-y-3">
              {mockTrendingMemes.map((meme, index) => (
                <div key={meme.id} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg hover:bg-dark-bg/70 transition cursor-pointer">
                  <span className="text-2xl font-bold text-gem-gold">#{index + 1}</span>
                  <span className="text-3xl">{meme.preview}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{meme.title}</p>
                    <p className="text-xs text-gray-400">by @{meme.creator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gem-crystal font-semibold">{meme.votes}</p>
                    <p className="text-xs text-gray-400">votes</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/meme-generator" className="block w-full mt-4 text-center bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg py-2 rounded-lg font-semibold hover:opacity-90 transition">
              Create Your Meme
            </Link>
          </div>

          // Mini Leaderboard
          <div className="bg-dark-card border border-gem-pink/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gem-pink" />
              Top Players
            </h2>
            <div className="space-y-2">
              {mockLeaderboard.map(player => (
                <div key={player.rank} className="flex items-center gap-3 p-2 hover:bg-dark-bg rounded transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    player.rank === 1 ? 'bg-gem-gold text-dark-bg' :
                    player.rank === 2 ? 'bg-gem-crystal text-dark-bg' :
                    player.rank === 3 ? 'bg-gem-pink text-dark-bg' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {player.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{player.user}</p>
                    <p className="text-xs text-gray-400">{player.score.toLocaleString()} pts</p>
                  </div>
                  <div>
                    {player.change === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {player.change === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/empire" className="block w-full mt-4 text-center text-sm text-gem-pink hover:text-gem-gold transition">
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </section>

      // Your Empire Status
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-gem-purple/10 via-gem-gold/10 to-gem-crystal/10 border border-gem-gold/30 rounded-xl p-6">
            <div className="grid md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-1">Your Position</p>
                <p className="text-2xl font-bold text-gem-crystal">#157</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">$BB Balance</p>
                <p className="text-2xl font-bold text-white">45,230</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Next Tier</p>
                <p className="text-2xl font-bold text-gem-gold">4,770</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Multiplier</p>
                <p className="text-2xl font-bold text-gem-pink">3.2x</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Est. Rewards</p>
                <p className="text-2xl font-bold text-green-500">~500 $BB</p>
              </div>
            </div>
            <div className="mt-6 flex gap-4 justify-center">
              <Link href="/empire" className="px-6 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg rounded-lg font-semibold hover:opacity-90 transition">
                View Empire Details
              </Link>
              <Link href="/swap" className="px-6 py-2 border border-gem-crystal/30 text-white rounded-lg font-semibold hover:bg-gem-crystal/10 transition">
                Buy More $BB
              </Link>
            </div>
          </div>
        </div>
      </section>

      // Events & Announcements
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-gem-crystal" />
            Upcoming Events
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal text-xs rounded-full font-semibold">LIVE</span>
                <span className="text-xs text-gray-400">2d 14h left</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Meme Contest #42</h3>
              <p className="text-sm text-gray-400 mb-3">Create the wildest meme to win 1000 $BB</p>
              <Link href="/meme-generator" className="text-sm text-gem-crystal hover:text-gem-gold">
                Join Contest →
              </Link>
            </div>

            <div className="bg-dark-card border border-gem-gold/20 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold text-xs rounded-full font-semibold">SOON</span>
                <span className="text-xs text-gray-400">Dec 15</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Treasury Distribution</h3>
              <p className="text-sm text-gray-400 mb-3">Monthly rewards for all Empire members</p>
              <span className="text-sm text-gem-gold">50,000 $BB Pool</span>
            </div>

            <div className="bg-dark-card border border-gem-pink/20 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-gem-pink/20 text-gem-pink text-xs rounded-full font-semibold">FLASH</span>
                <span className="text-xs text-gray-400">30 min left</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2x Booster Sale</h3>
              <p className="text-sm text-gray-400 mb-3">Double your Empire multiplier</p>
              <Link href="/empire" className="text-sm text-gem-pink hover:text-gem-gold">
                Get Booster →
              </Link>
            </div>
          </div>
        </div>
      </section>

      // Quick Game Launcher
      <section className="px-4 py-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-gem-pink" />
            Jump Into Games
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Treasure Quest', players: 42, icon: '💰' },
              { name: 'Beast Battle', players: 28, icon: '⚔️' },
              { name: 'Memory Match', players: 15, icon: '🧩' },
              { name: 'Vibe Cards', players: 31, icon: '🎴' },
            ].map(game => (
              <Link
                key={game.name}
                href="/games"
                className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 text-center hover:border-gem-crystal/40 hover:scale-105 transition-all"
              >
                <span className="text-3xl block mb-2">{game.icon}</span>
                <p className="text-white font-semibold text-sm">{game.name}</p>
                <p className="text-xs text-gray-400 mt-1">{game.players} playing</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
*/