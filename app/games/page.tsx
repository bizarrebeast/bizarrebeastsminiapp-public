import Link from 'next/link';
import { ExternalLink, Gamepad2, Globe, MessageSquare, Smartphone, Trophy, Users, Zap } from 'lucide-react';

const games = [
  {
    id: 'treasure-quest',
    name: 'Bizarre Underground Treasure Quest',
    description: 'The original treasure hunting adventure with BizarreBeasts',
    platform: 'Telegram',
    platformIcon: MessageSquare,
    url: 'https://t.me/treasurequestbot',
    color: 'gem-gold',
    borderColor: 'border-gem-gold/20',
    hoverShadow: 'hover:shadow-gold',
    stats: {
      players: '5,000+',
      dailyActive: '1,200+',
      totalGems: '1M+',
    },
    features: ['Daily rewards', 'Gem collection', 'Leaderboards', 'NFT rewards'],
  },
  {
    id: 'vibecards',
    name: 'Vibecards',
    description: 'Check your vibe and collect unique character cards',
    platform: 'World App',
    platformIcon: Globe,
    url: 'https://worldapp.com/vibecards',
    color: 'gem-crystal',
    borderColor: 'border-gem-crystal/20',
    hoverShadow: 'hover:shadow-crystal',
    stats: {
      players: '3,000+',
      cardsCollected: '50,000+',
      vibeChecks: '100,000+',
    },
    features: ['Vibe checking', 'Card collection', 'Trading', 'Social features'],
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Test your memory with BizarreBeasts characters',
    platform: 'Web',
    platformIcon: Globe,
    url: '/games/memory-match',
    color: 'gem-blue',
    borderColor: 'border-gem-blue/20',
    hoverShadow: 'hover:shadow-gem',
    stats: {
      players: '2,000+',
      gamesPlayed: '25,000+',
      highScore: '9,999',
    },
    features: ['Multiple difficulties', 'Time challenges', 'Power-ups', 'Achievements'],
  },
  {
    id: 'beast-battle',
    name: 'Beast Battle',
    description: 'Strategic card battles with your favorite beasts',
    platform: 'Telegram',
    platformIcon: MessageSquare,
    url: 'https://t.me/beastbattlebot',
    color: 'gem-purple',
    borderColor: 'border-gem-purple/20',
    hoverShadow: 'hover:shadow-gem',
    stats: {
      players: '4,000+',
      battles: '50,000+',
      tournaments: '100+',
    },
    features: ['PvP battles', 'Tournament mode', 'Card upgrades', 'Season rewards'],
  },
  {
    id: 'gem-rush',
    name: 'Gem Rush',
    description: 'Fast-paced gem collecting arcade action',
    platform: 'Mobile',
    platformIcon: Smartphone,
    url: '#',
    color: 'gem-pink',
    borderColor: 'border-gem-pink/20',
    hoverShadow: 'hover:shadow-gem',
    comingSoon: true,
    stats: {
      preRegistered: '1,500+',
      expectedLaunch: 'Q2 2024',
    },
    features: ['Arcade gameplay', 'Daily challenges', 'Global leaderboard', 'Gem rewards'],
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">
            BizarreBeasts Games
          </h1>
          <p className="text-xl text-gray-300">
            Play, earn, and compete across multiple platforms
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300">
            <Gamepad2 className="w-8 h-8 text-gem-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-gold">5</div>
            <div className="text-sm text-gray-400">Active Games</div>
          </div>
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 text-center transition-all duration-300">
            <Users className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-crystal">15K+</div>
            <div className="text-sm text-gray-400">Total Players</div>
          </div>
          <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-4 text-center transition-all duration-300">
            <Trophy className="w-8 h-8 text-gem-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-blue">$10K</div>
            <div className="text-sm text-gray-400">Prizes Given</div>
          </div>
          <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-4 text-center transition-all duration-300">
            <Zap className="w-8 h-8 text-gem-purple mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-purple">200K+</div>
            <div className="text-sm text-gray-400">Games Played</div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const PlatformIcon = game.platformIcon;
            return (
              <div
                key={game.id}
                className={`bg-dark-card border ${game.borderColor} rounded-lg p-6 ${game.hoverShadow} transition-all duration-300 ${
                  game.comingSoon ? 'opacity-75' : ''
                }`}
              >
                {/* Game Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-${game.color}/20 rounded-lg flex items-center justify-center`}>
                    <Gamepad2 className={`w-6 h-6 text-${game.color}`} />
                  </div>
                  {game.comingSoon && (
                    <span className="bg-gem-gold/20 text-gem-gold text-xs px-2 py-1 rounded-full font-semibold">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Game Info */}
                <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{game.description}</p>

                {/* Platform Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <PlatformIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{game.platform}</span>
                </div>

                {/* Stats */}
                {!game.comingSoon ? (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    {Object.entries(game.stats).slice(0, 2).map(([key, value]) => (
                      <div key={key}>
                        <div className={`text-${game.color} font-semibold`}>{value}</div>
                        <div className="text-gray-500 text-xs capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 text-sm">
                    <div className="text-gem-gold font-semibold">{game.stats.preRegistered}</div>
                    <div className="text-gray-500 text-xs">Pre-registered</div>
                    <div className="text-gray-400 mt-2">{game.stats.expectedLaunch}</div>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {game.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className={`text-xs bg-${game.color}/10 text-${game.color} px-2 py-1 rounded`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Play Button */}
                {!game.comingSoon ? (
                  <Link
                    href={game.url}
                    target={game.url.startsWith('http') ? '_blank' : undefined}
                    className={`w-full bg-gradient-to-r from-${game.color} to-${
                      game.color === 'gem-gold' ? 'gem-crystal' : 'gem-gold'
                    } text-dark-bg px-4 py-2 rounded-lg font-semibold ${game.hoverShadow} transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2`}
                  >
                    Play Now
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-700 text-gray-400 px-4 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-gem-crystal/20 to-gem-purple/20 rounded-lg p-8 border border-gem-crystal/30">
            <h2 className="text-2xl font-bold mb-4">🎮 More Games Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              We're constantly building new ways to play and earn with BizarreBeasts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/leaderboard"
                className="inline-block bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                View Leaderboard
              </Link>
              <a
                href="https://discord.gg/bizarrebeasts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-gem-purple to-gem-pink text-dark-bg px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Join Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}