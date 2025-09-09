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
        <div className="text-center mb-12 flex justify-center">
          <img 
            src="/assets/page-assets/banners/bizarrebeasts-games-banner.png" 
            alt={`BizarreBeasts Games - 8 Hand-crafted games with over ${formatPlayCount(totalPlays)} plays!`}
            className="w-full max-w-4xl object-contain rounded-2xl"
          />
        </div>
        
        {/* Description */}
        <p className="text-lg text-gray-300 mb-8 max-w-4xl mx-auto px-4 text-center">
          Play all 8 original BizarreBeasts games powered by Remix! Each game features original hand-illustrated BizarreBeasts artwork and characters from the universe. Jump into adventures, collect treasures, and experience the full BIZARRE gaming ecosystem. All games are playable across multiple platforms, including Farcaster, Telegram, World App, and coming soon to iOS and Android!
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300">
            <Gamepad2 className="w-8 h-8 text-gem-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-gold">8</div>
            <div className="text-sm text-gray-400">Games</div>
          </div>
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 text-center transition-all duration-300">
            <PlayCircle className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">{formatPlayCount(totalPlays)}</div>
            <div className="text-sm text-gray-400">Total Plays</div>
          </div>
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300">
            <Trophy className="w-8 h-8 text-gem-gold mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">42K</div>
            <div className="text-sm text-gray-400">Top Game Plays</div>
          </div>
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-4 text-center transition-all duration-300">
            <Users className="w-8 h-8 text-gem-pink mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">10K+</div>
            <div className="text-sm text-gray-400">Players</div>
          </div>
        </div>

        {/* Featured Game Banner - Treasure Quest */}
        <div className="mb-12">
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
            
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Game Info */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    BizarreBeasts: Treasure Quest
                  </h2>
                  
                  <p className="text-gray-300 mb-4 text-lg">
                    Climb endless crystal caverns as BizBe in this retro arcade platformer! Jump on enemies, collect gems, and discover treasure chests through 5 chapters, 50+ levels, and endless BEAST MODE with progressive difficulty. How high can you ascend and how many gems can you collect?
                  </p>
                  
                  <div className="bg-dark-bg/50 rounded-lg p-4 mb-4">
                    <p className="text-gray-400 italic">
                      "I poured over 300 hours into building the entire game, including all of the art, animations, and game logic, to make it as fun, BIZARRE, and creative as possible. The game includes an original character, BizBe, 9 enemies, 5 chapters with 10 levels each, bonus levels, over 70 original backgrounds, and Level 51+ becomes BEAST MODE!"
                    </p>
                    <p className="text-gem-gold text-sm mt-2">— Creator</p>
                  </div>

                  {/* Game Features */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gem-crystal">50+</div>
                      <div className="text-xs text-gray-400">Levels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gem-gold">5</div>
                      <div className="text-xs text-gray-400">Chapters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gem-pink">9</div>
                      <div className="text-xs text-gray-400">Enemies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">∞</div>
                      <div className="text-xs text-gray-400">Beast Mode</div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="lg:w-80 flex flex-col justify-center">
                  <div className="bg-gradient-to-br from-dark-bg via-dark-bg to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-3">Player's Guide</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      This guide is your ultimate companion to navigating the BIZARRE and treasure-filled crystal caverns of BizarreBeasts: Treasure Quest. Inside, you'll learn everything you need to know to become a BIZARRE treasure quester.
                    </p>
                    <a
                      href="https://paragraph.com/@bizarrebeasts/the-official-players-guide-bizarrebeasts-treasure-quest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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

        {/* Sort Options */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSortBy('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              sortBy === 'all' 
                ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg' 
                : 'bg-dark-card border border-gem-crystal/20 text-gray-400 hover:text-gem-crystal'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              sortBy === 'popular' 
                ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg' 
                : 'bg-dark-card border border-gem-crystal/20 text-gray-400 hover:text-gem-crystal'
            }`}
          >
            Most Popular
          </button>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGames.map((game, index) => {
            // Determine if any platform link exists
            const hasLink = game.platforms.farcaster || game.platforms.telegram || 
                          game.platforms.worldApp || game.platforms.online;
            
            // Use a rotation of gradient backgrounds for variety
            const borderColors = [
              'border-gem-crystal/20 hover:shadow-gem-crystal/20',
              'border-gem-gold/20 hover:shadow-gem-gold/20',
              'border-gem-pink/20 hover:shadow-gem-pink/20'
            ];
            const borderStyle = borderColors[index % borderColors.length];
            
            return (
              <div
                key={game.id}
                className={`bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border ${borderStyle} rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col`}
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
                      <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
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
                      className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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
                className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Join Empire
              </Link>
              <Link
                href="/meme-generator"
                className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
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