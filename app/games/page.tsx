'use client';

import Link from 'next/link';
import { ExternalLink, Gamepad2, Globe, MessageSquare, Smartphone, Trophy, Users, Zap, PlayCircle } from 'lucide-react';
import { gamesData, formatPlayCount, getTotalPlays, getGamesByPopularity } from '@/lib/games-data';
import { useState } from 'react';

const platformIcons: Record<string, any> = {
  telegram: MessageSquare,
  worldApp: Globe,
  online: Globe,
  farcaster: MessageSquare,
};

export default function GamesPage() {
  const [sortBy, setSortBy] = useState<'all' | 'popular'>('all');
  const displayGames = sortBy === 'popular' ? getGamesByPopularity() : gamesData;
  const totalPlays = getTotalPlays();

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">
            BizarreBeasts Games
          </h1>
          <p className="text-xl text-gray-300">
            8 Hand-crafted games with over {formatPlayCount(totalPlays)} plays!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300">
            <Gamepad2 className="w-8 h-8 text-gem-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-gold">8</div>
            <div className="text-sm text-gray-400">Games</div>
          </div>
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 text-center transition-all duration-300">
            <PlayCircle className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-crystal">{formatPlayCount(totalPlays)}</div>
            <div className="text-sm text-gray-400">Total Plays</div>
          </div>
          <div className="bg-dark-card border border-gem-blue/20 rounded-lg p-4 text-center transition-all duration-300">
            <Trophy className="w-8 h-8 text-gem-blue mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-blue">42K</div>
            <div className="text-sm text-gray-400">Top Game Plays</div>
          </div>
          <div className="bg-dark-card border border-gem-purple/20 rounded-lg p-4 text-center transition-all duration-300">
            <Users className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">10K+</div>
            <div className="text-sm text-gray-400">Players</div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSortBy('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              sortBy === 'all' 
                ? 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg' 
                : 'bg-dark-card border border-gem-crystal/20 text-gray-400 hover:text-gem-crystal'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              sortBy === 'popular' 
                ? 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg' 
                : 'bg-dark-card border border-gem-crystal/20 text-gray-400 hover:text-gem-crystal'
            }`}
          >
            Most Popular
          </button>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGames.map((game, index) => {
            const gameColors = ['gem-gold', 'gem-crystal', 'gem-blue', 'gem-purple', 'gem-pink'];
            const color = gameColors[index % gameColors.length];
            
            // Determine if any platform link exists
            const hasLink = game.platforms.farcaster || game.platforms.telegram || 
                          game.platforms.worldApp || game.platforms.online;
            
            return (
              <div
                key={game.id}
                className={`bg-dark-card border border-${color}/20 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-${color}/20 transition-all duration-300 flex flex-col`}
              >
                {/* Banner Image - Square */}
                {game.bannerImage && (
                  <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    <img 
                      src={game.bannerImage} 
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                    {game.featured && (
                      <span className="absolute top-2 right-2 bg-gem-gold/90 text-dark-bg text-xs px-2 py-1 rounded-full font-semibold">
                        Featured
                      </span>
                    )}
                  </div>
                )}

                {/* Game Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Game Info */}
                  <h3 className="text-xl font-semibold mb-2">{game.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 flex-1">{game.shortDescription}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className={`text-2xl font-bold bg-gradient-to-r from-${color} to-gem-crystal bg-clip-text text-transparent`}>
                        {formatPlayCount(game.plays)}
                      </div>
                      <div className="text-gray-500 text-xs">Plays</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{game.genre}</div>
                      <div className="text-gray-500 text-xs">Genre</div>
                    </div>
                  </div>

                  {/* Platform Links */}
                  <div className="flex gap-2 mb-4">
                    {game.platforms.farcaster && (
                      <a
                        href={game.platforms.farcaster}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-500/20 text-purple-400 p-2 rounded-lg hover:bg-purple-500/30 transition-colors"
                        title="Play on Farcaster"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    {game.platforms.telegram && (
                      <a
                        href={game.platforms.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Play on Telegram"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    {game.platforms.worldApp && (
                      <a
                        href={game.platforms.worldApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500/20 text-green-400 p-2 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="Play on World App"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {game.platforms.online && (
                      <a
                        href={game.platforms.online}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gem-crystal/20 text-gem-crystal p-2 rounded-lg hover:bg-gem-crystal/30 transition-colors"
                        title="Play Online"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Play Button */}
                  {hasLink ? (
                    <a
                      href={Object.values(game.platforms).find(url => url) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full bg-gradient-to-r from-${color} to-${color === 'gem-gold' ? 'gem-crystal' : 'gem-gold'} text-dark-bg px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2`}
                    >
                      Play Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      className="w-full bg-gray-700 text-gray-400 px-4 py-2 rounded-lg font-semibold"
                    >
                      Links Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>


        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-dark-card rounded-lg p-8 border border-gem-crystal/20">
            <h2 className="text-2xl font-bold mb-4">🚀 More Games Coming!</h2>
            <p className="text-gray-300 mb-6">
              Join the BizarreBeasts community to get early access to new games
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/empire"
                className="inline-block bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Join Empire
              </Link>
              <Link
                href="/meme-generator"
                className="inline-block bg-gradient-to-r from-gem-crystal to-gem-gold text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Create Memes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}