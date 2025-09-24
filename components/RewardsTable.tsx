'use client';

import { useState } from 'react';

export default function RewardsTable() {
  const [showRewardDetails, setShowRewardDetails] = useState(false);

  return (
    <div className="bg-gradient-to-br from-black/80 via-gem-dark/50 to-black/80 border border-gem-gold/20 rounded-xl p-6 backdrop-blur-sm">
      <button
        onClick={() => setShowRewardDetails(!showRewardDetails)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-xl font-bold bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
          💎 Reward Structure & Milestones
        </h3>
        <span className="text-gem-crystal text-2xl">
          {showRewardDetails ? '−' : '+'}
        </span>
      </button>

      {showRewardDetails && (
        <div className="mt-6 space-y-6">
          {/* Tier Rewards Table */}
          <div className="bg-black/40 rounded-lg p-4">
            <h4 className="text-lg font-bold text-gem-gold mb-4">📊 Tier Rewards Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gem-gold/30">
                    <th className="text-left py-2 text-gem-crystal">Tier</th>
                    <th className="text-right py-2 text-gem-crystal">5-Day</th>
                    <th className="text-right py-2 text-gem-crystal">15-Day</th>
                    <th className="text-right py-2 text-gem-crystal">30-Day</th>
                    <th className="text-right py-2 text-gem-crystal">
                      <span className="hidden sm:inline">Total/Month</span>
                      <span className="sm:hidden">Total/<br/>Month</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gem-gold/10">
                    <td className="py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                        <span className="text-2xl sm:text-base">👹</span>
                        <span className="text-gem-gold font-bold">BIZARRE</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-gem-crystal">250K</td>
                    <td className="text-right py-2 text-gem-crystal">500K</td>
                    <td className="text-right py-2 text-gem-crystal">1M</td>
                    <td className="text-right py-2 font-bold text-gem-gold">3.25M</td>
                  </tr>
                  <tr className="border-b border-gem-gold/10">
                    <td className="py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                        <span className="text-2xl sm:text-base">🤡</span>
                        <span className="text-gem-purple font-bold">WEIRDO</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-gem-crystal">100K</td>
                    <td className="text-right py-2 text-gem-crystal">250K</td>
                    <td className="text-right py-2 text-gem-crystal">500K</td>
                    <td className="text-right py-2 font-bold text-gem-purple">1.55M</td>
                  </tr>
                  <tr className="border-b border-gem-gold/10">
                    <td className="py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                        <span className="text-2xl sm:text-base">🎭</span>
                        <span className="text-gem-blue font-bold">ODDBALL</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-gem-crystal">50K</td>
                    <td className="text-right py-2 text-gem-crystal">100K</td>
                    <td className="text-right py-2 text-gem-crystal">200K</td>
                    <td className="text-right py-2 font-bold text-gem-blue">650K</td>
                  </tr>
                  <tr className="border-b border-gem-gold/10">
                    <td className="py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                        <span className="text-2xl sm:text-base">👾</span>
                        <span className="text-gem-crystal font-bold">MISFIT</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-gem-crystal">25K</td>
                    <td className="text-right py-2 text-gem-crystal">50K</td>
                    <td className="text-right py-2 text-gem-crystal">100K</td>
                    <td className="text-right py-2 font-bold text-gem-crystal">325K</td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                        <span className="text-2xl sm:text-base">😐</span>
                        <span className="text-gray-400 font-bold">NORMIE</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-gem-crystal">25K</td>
                    <td className="text-right py-2 text-gray-400">-</td>
                    <td className="text-right py-2 text-gray-400">-</td>
                    <td className="text-right py-2 font-bold text-gem-crystal">150K</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gem-crystal/60 mt-3">
              * Total assumes 6 five-day cycles + milestone bonuses per month
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-black/40 rounded-lg p-4">
            <h4 className="text-lg font-bold text-gem-gold mb-3">🎯 How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gem-blue/10 to-transparent p-3 rounded-lg border border-gem-blue/20">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-sm font-bold text-gem-blue">5-Day Cycles</div>
                <div className="text-xs text-gem-crystal mt-1">
                  Check in daily for 5 days to earn tier-based rewards
                </div>
              </div>
              <div className="bg-gradient-to-br from-gem-gold/10 to-transparent p-3 rounded-lg border border-gem-gold/20">
                <div className="text-2xl mb-1">🌟</div>
                <div className="text-sm font-bold text-gem-gold">Milestones</div>
                <div className="text-xs text-gem-crystal mt-1">
                  Bonus rewards at 15 and 30 day streaks for top tiers
                </div>
              </div>
              <div className="bg-gradient-to-br from-gem-pink/10 to-transparent p-3 rounded-lg border border-gem-pink/20">
                <div className="text-2xl mb-1">🔄</div>
                <div className="text-sm font-bold text-gem-pink">30-Day Reset</div>
                <div className="text-xs text-gem-crystal mt-1">
                  After 30 days, cycle resets for continuous earning
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-black/40 rounded-lg p-4">
            <h4 className="text-lg font-bold text-gem-gold mb-3">📋 Check-In Rules</h4>
            <ul className="space-y-2 text-sm text-gem-crystal">
              <li className="flex items-start">
                <span className="text-gem-gold mr-2">•</span>
                <span>Check in once every 20-44 hours to maintain your streak</span>
              </li>
              <li className="flex items-start">
                <span className="text-gem-gold mr-2">•</span>
                <span>Missing a check-in after 44 hours breaks your streak</span>
              </li>
              <li className="flex items-start">
                <span className="text-gem-gold mr-2">•</span>
                <span>Rewards are only given at 5-day intervals and milestones</span>
              </li>
              <li className="flex items-start">
                <span className="text-gem-gold mr-2">•</span>
                <span>Higher Empire tiers earn significantly more rewards</span>
              </li>
              <li className="flex items-start">
                <span className="text-gem-gold mr-2">•</span>
                <span>30-day cycle resets after completion for continuous earning</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}