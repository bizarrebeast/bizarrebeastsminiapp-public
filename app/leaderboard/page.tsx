'use client';

import { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Gamepad2, Crown, Star, ChevronUp, ChevronDown } from 'lucide-react';

type LeaderboardType = 'global' | 'weekly' | 'daily';
type GameFilter = 'all' | 'treasure-quest' | 'vibecards' | 'memory-match' | 'beast-battle';

const mockLeaderboardData = {
  global: [
    { rank: 1, username: 'BeastMaster', avatar: '🦾', score: 125420, gems: 8500, level: 42, change: 0 },
    { rank: 2, username: 'GemHunter', avatar: '💎', score: 118350, gems: 7800, level: 40, change: 2 },
    { rank: 3, username: 'VibeChecker', avatar: '✨', score: 115200, gems: 7200, level: 39, change: -1 },
    { rank: 4, username: 'TreasureKing', avatar: '👑', score: 112000, gems: 6900, level: 38, change: 1 },
    { rank: 5, username: 'CrystalQueen', avatar: '💠', score: 108500, gems: 6500, level: 37, change: -2 },
    { rank: 6, username: 'GoldRush', avatar: '🌟', score: 105000, gems: 6200, level: 36, change: 3 },
    { rank: 7, username: 'BeastMode', avatar: '🔥', score: 102300, gems: 5900, level: 35, change: 0 },
    { rank: 8, username: 'GemCollector', avatar: '💰', score: 98700, gems: 5600, level: 34, change: -2 },
    { rank: 9, username: 'VibeKing', avatar: '👾', score: 95200, gems: 5300, level: 33, change: 1 },
    { rank: 10, username: 'TreasureBeast', avatar: '🦖', score: 92000, gems: 5000, level: 32, change: -1 },
  ],
  weekly: [
    { rank: 1, username: 'WeeklyWarrior', avatar: '⚔️', score: 15420, gems: 850, level: 25, change: 5 },
    { rank: 2, username: 'GemHunter', avatar: '💎', score: 14350, gems: 780, level: 40, change: 0 },
    { rank: 3, username: 'SpeedRunner', avatar: '⚡', score: 13200, gems: 720, level: 22, change: 12 },
    { rank: 4, username: 'BeastMaster', avatar: '🦾', score: 12000, gems: 690, level: 42, change: -2 },
    { rank: 5, username: 'NewChallenger', avatar: '🌟', score: 11500, gems: 650, level: 18, change: 99 },
  ],
  daily: [
    { rank: 1, username: 'DailyGrinder', avatar: '💪', score: 2420, gems: 150, level: 15, change: 0 },
    { rank: 2, username: 'QuickPlay', avatar: '🎮', score: 2350, gems: 140, level: 12, change: 3 },
    { rank: 3, username: 'BeastMaster', avatar: '🦾', score: 2200, gems: 130, level: 42, change: -1 },
    { rank: 4, username: 'CasualGamer', avatar: '🎯', score: 2000, gems: 120, level: 8, change: 0 },
    { rank: 5, username: 'MorningPlayer', avatar: '☀️', score: 1850, gems: 110, level: 10, change: 2 },
  ],
};

export default function LeaderboardPage() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('global');
  const [selectedGame, setSelectedGame] = useState<GameFilter>('all');

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-gem-gold';
      case 2:
        return 'text-gem-crystal';
      case 3:
        return 'text-gem-blue';
      default:
        return 'text-gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-gem-gold" />;
      case 2:
        return <Medal className="w-5 h-5 text-gem-crystal" />;
      case 3:
        return <Award className="w-5 h-5 text-gem-blue" />;
      default:
        return <span className="text-gray-400">#{rank}</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-gray-500">-</span>;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-blue bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-300">
            Compete with the best BizarreBeasts players
          </p>
        </div>

        {/* Top Players Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {mockLeaderboardData.global.slice(0, 3).map((player, index) => (
            <div
              key={player.rank}
              className={`bg-dark-card border ${
                index === 0
                  ? 'border-gem-gold/40'
                  : index === 1
                  ? 'border-gem-crystal/40'
                  : 'border-gem-blue/40'
              } rounded-lg p-6 text-center hover:scale-105 transition-all duration-300`}
            >
              <div className="text-4xl mb-2">{player.avatar}</div>
              {getRankIcon(player.rank)}
              <h3 className={`text-xl font-bold mt-2 ${getRankColor(player.rank)}`}>
                {player.username}
              </h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Score</span>
                  <span className="font-semibold">{player.score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gems</span>
                  <span className="font-semibold text-gem-crystal">{player.gems.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Level</span>
                  <span className="font-semibold text-gem-gold">{player.level}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Time Filter */}
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Time Period</label>
              <div className="flex gap-2">
                {(['global', 'weekly', 'daily'] as LeaderboardType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      selectedType === type
                        ? 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg'
                        : 'bg-dark-panel text-gray-400 hover:text-gem-crystal hover:border-gem-crystal/40 border border-transparent'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Filter */}
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Game</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as GameFilter)}
                className="w-full px-4 py-2 bg-dark-panel border border-gem-crystal/20 rounded-lg text-white focus:border-gem-crystal/40 focus:outline-none transition-all duration-300"
              >
                <option value="all">All Games</option>
                <option value="treasure-quest">Treasure Quest</option>
                <option value="vibecards">Vibecards</option>
                <option value="memory-match">Memory Match</option>
                <option value="beast-battle">Beast Battle</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-dark-card border border-gem-purple/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-panel border-b border-gem-purple/20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Player</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Score</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Gems</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Level</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Change</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboardData[selectedType].map((player) => (
                  <tr
                    key={player.rank}
                    className="border-b border-gem-purple/10 hover:bg-gem-purple/5 transition-all duration-300"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(player.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <span className={`font-semibold ${getRankColor(player.rank)}`}>
                          {player.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {player.score.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gem-crystal font-semibold">
                        {player.gems.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gem-gold font-semibold">{player.level}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {getChangeIcon(player.change)}
                        {player.change !== 0 && player.change !== 99 && (
                          <span className={`text-xs ${player.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.abs(player.change)}
                          </span>
                        )}
                        {player.change === 99 && (
                          <span className="text-xs text-gem-gold">NEW</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your Position */}
        <div className="mt-8 bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 rounded-lg p-6 border border-gem-crystal/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Your Position</h3>
              <p className="text-gray-300">
                You're ranked <span className="text-gem-gold font-bold">#157</span> globally
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gem-crystal">45,230</div>
              <div className="text-sm text-gray-400">Total Score</div>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <button className="flex-1 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              View My Stats
            </button>
            <button className="flex-1 bg-gradient-to-r from-gem-purple to-gem-pink text-dark-bg px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Challenge Friend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}