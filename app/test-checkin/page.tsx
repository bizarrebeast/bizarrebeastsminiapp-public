'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Gift, AlertCircle, Lock } from 'lucide-react';
import RewardsTable from '@/components/RewardsTable';
import CheckIn from '@/components/CheckIn';

export default function TestCheckInPage() {
  const [isOpen, setIsOpen] = useState(true); // Start open for testing
  const [completedRituals] = useState(3);
  const hasCompletedRituals = completedRituals >= 3;
  const hasWallet = true;
  const hasEmpireRank = true;
  const isEligible = true;
  const empireTier = 'WEIRDO';
  const farcasterConnected = true;
  const farcasterUsername = 'testuser';
  const farcasterFid = 12345;

  const status = {
    icon: '✅',
    text: 'Check-ins unlocked! Claim your daily rewards',
    color: 'text-gem-crystal'
  };

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Check-In Component Test</h1>
        <p className="text-gray-400 mb-8">Testing the unified container design</p>

        {/* ISOLATED TEST BUTTON */}
        <button
          onClick={() => alert('BASIC BUTTON WORKS!')}
          className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          TEST BUTTON - Click me!
        </button>

        {/* NEW UNIFIED DESIGN */}
        <div className="mb-12">
          {/* Collapsible Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full bg-gradient-to-br from-dark-card via-dark-card ${
              isEligible ? 'to-gem-gold/10' : 'to-gem-crystal/5'
            } border ${
              isEligible ? 'border-gem-gold/30' : 'border-gem-crystal/20'
            } rounded-xl p-4 sm:p-6 transition-all duration-300 hover:border-opacity-50`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Section - Title and Status */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="text-2xl sm:text-3xl flex-shrink-0">☀️</div>
                <div className="text-left flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    Daily Check-In Rewards
                  </h2>
                  <p className={`text-xs sm:text-sm ${status.color} mt-1`}>
                    <span className="mr-2">{status.icon}</span>
                    {status.text}
                  </p>
                </div>
              </div>

              {/* Right Section - Badges and Chevron */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                    hasCompletedRituals ? 'bg-gem-crystal/20 text-gem-crystal' : 'bg-dark-bg text-gray-500'
                  }`}>
                    {completedRituals}/3 Rituals Shared
                  </div>

                  {hasWallet && (
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                      hasEmpireRank ? 'bg-gem-gold/20 text-gem-gold' : 'bg-dark-bg text-gray-500'
                    }`}>
                      {hasEmpireRank ? (empireTier || 'RANKED') : 'Not Ranked'}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <div className="text-gem-crystal flex-shrink-0">
                  {isOpen ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
              </div>
            </div>
          </button>

          {/* UNIFIED CONTAINER - Collapsible Content */}
          {isOpen && (
            <div
              className="mt-4 bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300"
              onClickCapture={(e) => {
                console.log('Container click captured:', e.target);
              }}
            >

              {/* Section 1: How It Works */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  💎 How Daily Check-In Rewards Work
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-dark-bg/30 rounded-lg">
                    <div className="text-2xl mb-2">1️⃣</div>
                    <h4 className="font-semibold text-gem-crystal mb-2">Complete & Share 3 Rituals</h4>
                    <p className="text-xs text-gray-400">Complete and share any 3 daily rituals to unlock eligibility</p>
                  </div>

                  <div className="text-center p-4 bg-dark-bg/30 rounded-lg">
                    <div className="text-2xl mb-2">2️⃣</div>
                    <h4 className="font-semibold text-gem-gold mb-2">Get Empire Rank</h4>
                    <p className="text-xs text-gray-400">Hold $BB tokens to rank up in the Empire</p>
                  </div>

                  <div className="text-center p-4 bg-dark-bg/30 rounded-lg">
                    <div className="text-2xl mb-2">3️⃣</div>
                    <h4 className="font-semibold text-gem-pink mb-2">Earn $BB Daily</h4>
                    <p className="text-xs text-gray-400">Check in daily and claim rewards every 5 days!</p>
                  </div>
                </div>

                {/* Farcaster Connection Status */}
                {farcasterConnected && (
                  <div className="mt-4 bg-dark-bg/30 border border-gem-crystal/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gem-crystal">✅</span>
                      <p className="text-sm text-gray-300">
                        Signed in as <span className="font-bold text-white">@{farcasterUsername}</span> (FID: {farcasterFid}) - Your shares will be verified automatically
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center mt-4">
                  <p className="text-xs text-gray-400">
                    <span className="text-gem-gold font-semibold">🧪 Beta Testing Phase:</span> Be among the first to earn $BB rewards on Base!
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gem-crystal/30 to-transparent"></div>

              {/* Section 2: Rewards Table - FULL COMPONENT with collapsible */}
              <div className="p-6">
                <RewardsTable />
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gem-gold/30 to-transparent"></div>

              {/* Section 3: Check-In Component - FULL COMPONENT */}
              <div className="p-6">
                <CheckIn
                  userTier={empireTier as any}
                  completedRituals={completedRituals}
                />
              </div>

            </div>
          )}
        </div>

        {/* Comparison Note */}
        <div className="mt-8 p-4 bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg">
          <h3 className="font-bold text-gem-crystal mb-2">Design Changes:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✅ All sections in one unified container</li>
            <li>✅ Subtle gradient dividers between sections</li>
            <li>✅ Consistent background flow</li>
            <li>✅ Reduced spacing (connected feel)</li>
            <li>✅ Inner content uses subtle bg variations (bg-dark-bg/30)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
