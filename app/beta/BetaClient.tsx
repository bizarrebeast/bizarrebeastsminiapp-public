'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { isBetaTester, MY_WALLETS, COMMUNITY_BETA_TESTERS } from '@/lib/beta-testers';
import { ChevronDown, ChevronUp, Flame, Trophy, Sun, Bug, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BetaClient() {
  const wallet = useWallet();
  const { farcasterUsername, farcasterFid } = useUnifiedAuthStore();
  const [activeTab, setActiveTab] = useState<'proveit' | 'coinflip' | 'checkin'>('proveit');
  const [openAccordion, setOpenAccordion] = useState<string | null>('access');

  const isBeta = isBetaTester(wallet.address);
  const isMyWallet = wallet.address ? MY_WALLETS.includes(wallet.address.toLowerCase()) : false;

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  // Not authorized view
  if (!wallet.address) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-bg via-black to-dark-bg text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent">
            Beta Access Required
          </h1>
          <p className="text-gray-400 mb-8">
            Please connect your wallet to view beta test instructions.
          </p>
          <Link
            href="/rituals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Go to Rituals
          </Link>
        </div>
      </div>
    );
  }

  if (!isBeta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-bg via-black to-dark-bg text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent">
            Not Authorized
          </h1>
          <p className="text-gray-400 mb-8">
            This page is only accessible to beta testers.
          </p>
          <Link
            href="/rituals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Go to Rituals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg via-black to-dark-bg text-white py-12 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full">

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gem-gold/20 border border-gem-gold/40 rounded-full mb-6">
            <span className="text-2xl">🧪</span>
            <span className="font-bold text-gem-gold">Beta Tester</span>
          </div>

          <h1 className="text-5xl font-bold mb-4 pb-1 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Welcome, {farcasterUsername ? `@${farcasterUsername}` : 'Tester'}!
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Thank you for helping us test BizarreBeasts! Your feedback is vital. You now have access to two new beta rituals and the Daily Check-In feature.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link
            href="/rituals"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-gem-purple/30 rounded-lg hover:border-gem-gold/50 hover:bg-gem-gold/10 transition-all text-center"
          >
            <Flame className="w-5 h-5 text-gem-gold" />
            <span className="font-semibold">Rituals</span>
          </Link>

          <Link
            href="/rituals/10"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-gem-purple/30 rounded-lg hover:border-gem-gold/50 hover:bg-gem-gold/10 transition-all text-center"
          >
            <Trophy className="w-5 h-5 text-gem-crystal" />
            <span className="font-semibold">Prove It</span>
          </Link>

          <Link
            href="/flip"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-gem-purple/30 rounded-lg hover:border-gem-gold/50 hover:bg-gem-gold/10 transition-all text-center"
          >
            <span className="text-xl">🪙</span>
            <span className="font-semibold">Coin Flip</span>
          </Link>

          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-gem-purple/30 rounded-lg hover:border-gem-gold/50 hover:bg-gem-gold/10 transition-all text-center"
          >
            <Bug className="w-5 h-5 text-gem-pink" />
            <span className="font-semibold">Report Bug</span>
          </Link>
        </div>

        {/* Your Beta Access - Accordion */}
        <div className="mb-8">
          <button
            onClick={() => toggleAccordion('access')}
            className="w-full flex items-center justify-between px-6 py-4 bg-dark-card border border-gem-gold/30 rounded-xl hover:border-gem-gold/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="font-bold text-lg">Confirm Your Beta Access</span>
            </div>
            {openAccordion === 'access' ? (
              <ChevronUp className="w-5 h-5 text-gem-gold" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gem-gold" />
            )}
          </button>

          {openAccordion === 'access' && (
            <div className="mt-2 px-6 py-4 bg-dark-card/50 border border-gem-gold/20 rounded-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Username:</span>
                  <span className="font-semibold text-gem-gold">
                    {farcasterUsername ? `@${farcasterUsername}` : 'Not connected'}
                  </span>
                </div>

                {farcasterFid && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Farcaster FID:</span>
                    <span className="font-semibold">{farcasterFid}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Wallet:</span>
                  <span className="font-mono text-sm">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400">Access Level:</span>
                  <span className="font-semibold text-gem-crystal">
                    {isMyWallet ? '🔧 Internal Tester' : '🧪 Community Beta Tester'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div className="mb-12 bg-dark-card border border-gem-purple/30 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            Getting Started
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gem-gold/20 flex items-center justify-center text-2xl font-bold text-gem-gold">
                1
              </div>
              <h3 className="font-semibold mb-2">Go to Rituals</h3>
              <p className="text-sm text-gray-400">
                Visit the rituals page using the button above
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gem-crystal/20 flex items-center justify-center text-2xl font-bold text-gem-crystal">
                2
              </div>
              <h3 className="font-semibold mb-2">Connect Wallet</h3>
              <p className="text-sm text-gray-400">
                Make sure you're connected with your beta wallet
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gem-pink/20 flex items-center justify-center text-2xl font-bold text-gem-pink">
                3
              </div>
              <h3 className="font-semibold mb-2">Start Testing</h3>
              <p className="text-sm text-gray-400">
                You'll see Rituals #10, #11, and Check-In
              </p>
            </div>
          </div>
        </div>

        {/* Beta Features - Tabs */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Beta Features</h2>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('proveit')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'proveit'
                  ? 'border-gem-crystal text-gem-crystal'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Ritual #10: Prove It</span>
            </button>

            <button
              onClick={() => setActiveTab('coinflip')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'coinflip'
                  ? 'border-gem-gold text-gem-gold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">🪙</span>
              <span>Ritual #11: Coin Flip</span>
            </button>

            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'checkin'
                  ? 'border-gem-pink text-gem-pink'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Daily Check-In</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-xl p-8">

            {/* Prove It Tab */}
            {activeTab === 'proveit' && (
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">⚔️</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Ritual #10: Prove It</h3>
                    <p className="text-gray-400">Daily on-chain attestations on Base</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-crystal">How to Complete</h4>
                  <ol className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">1.</span>
                      Click the "Prove It" ritual card
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">2.</span>
                      Click the "Create Attestation" button
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">3.</span>
                      Approve the transaction in your wallet
                    </li>
                  </ol>
                  <p className="text-sm text-gray-400 mt-3">
                    <strong>Note:</strong> You can attest once per day. Building your streak boosts your leaderboard ranking.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-crystal">What to Test (Critical Checks)</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Attestation transaction goes through successfully
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Streak count updates correctly after attestation
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Leaderboard is visible and functions properly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Cooldown timer shows accurate time until next attestation
                    </li>
                  </ul>
                </div>

                <Link
                  href="/rituals/10"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal to-gem-gold text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
                >
                  Go to Prove It
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Coin Flip Tab */}
            {activeTab === 'coinflip' && (
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">🪙</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Ritual #11: Coin Flip</h3>
                    <p className="text-gray-400">Gamble for 2× $BB rewards</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-gold">How to Complete</h4>
                  <ol className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">1.</span>
                      Click the "Coin Flip" ritual card
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">2.</span>
                      Choose Heads or Tails
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">3.</span>
                      Enter your bet amount (in $BB)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">4.</span>
                      Click "Flip Coin"
                    </li>
                  </ol>
                  <p className="text-sm text-gray-400 mt-3">
                    <strong>Win:</strong> Get 2× your bet back | <strong>Lose:</strong> The house keeps your bet
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-gold">What to Test (Critical Checks)</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Coin flip animation works properly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Wins and losses calculate $BB rewards correctly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Your $BB balance updates accurately after transaction
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Confetti animation shows when you win
                    </li>
                  </ul>
                </div>

                <Link
                  href="/flip"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
                >
                  Go to Coin Flip
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Check-In Tab */}
            {activeTab === 'checkin' && (
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">☀️</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Daily Check-In</h3>
                    <p className="text-gray-400">Earn $BB for consistency</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-pink">How to Complete</h4>
                  <ol className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">1.</span>
                      Complete <strong>3 or more rituals</strong> (any combination)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">2.</span>
                      Scroll to the "Daily Check-In" section
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">3.</span>
                      Click "Check In Now" button
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold">4.</span>
                      Share your check-in to Farcaster (optional bonus)
                    </li>
                  </ol>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3 text-gem-pink">What to Test (Critical Checks)</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Check-in only unlocks after completing 3 rituals
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      $BB reward amount displays correctly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Streak counter works and updates daily
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Share button functions correctly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-gem-gold mt-0.5 flex-shrink-0" />
                      Cannot double check-in on the same day
                    </li>
                  </ul>
                </div>

                <Link
                  href="/rituals#checkin"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-pink to-gem-crystal text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
                >
                  Go to Check-In
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bug Reporting - Accordion */}
        <div className="mb-8">
          <button
            onClick={() => toggleAccordion('bugs')}
            className="w-full flex items-center justify-between px-6 py-4 bg-dark-card border border-gem-pink/30 rounded-xl hover:border-gem-pink/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Bug className="w-6 h-6 text-gem-pink" />
              <span className="font-bold text-lg">🐛 Reporting Bugs & Issues</span>
            </div>
            {openAccordion === 'bugs' ? (
              <ChevronUp className="w-5 h-5 text-gem-pink" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gem-pink" />
            )}
          </button>

          {openAccordion === 'bugs' && (
            <div className="mt-2 px-6 py-6 bg-dark-card/50 border border-gem-pink/20 rounded-xl">
              <p className="text-gray-300 mb-4">
                If you encounter any issues, please report them so we can fix them ASAP. We aim to respond within 24-48 hours.
              </p>

              <h4 className="font-bold mb-3">What to Include in Every Report:</h4>
              <ul className="space-y-2 text-gray-300 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">•</span>
                  <strong>Feature:</strong> Which feature is affected (Prove It, Coin Flip, or Check-In)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">•</span>
                  <strong>Actual vs. Expected:</strong> What happened vs what you expected to happen
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">•</span>
                  <strong>Screenshot/Video:</strong> Always include one if possible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">•</span>
                  <strong>Device:</strong> Your device type (iOS, Android, or Desktop)
                </li>
              </ul>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-pink to-gem-crystal text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all"
              >
                <Bug className="w-5 h-5" />
                Submit Bug Report
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Key Info - Accordion */}
        <div className="mb-8">
          <button
            onClick={() => toggleAccordion('info')}
            className="w-full flex items-center justify-between px-6 py-4 bg-dark-card border border-gem-crystal/30 rounded-xl hover:border-gem-crystal/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <span className="font-bold text-lg">Key Information</span>
            </div>
            {openAccordion === 'info' ? (
              <ChevronUp className="w-5 h-5 text-gem-crystal" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gem-crystal" />
            )}
          </button>

          {openAccordion === 'info' && (
            <div className="mt-2 px-6 py-6 bg-dark-card/50 border border-gem-crystal/20 rounded-xl">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">✅</span>
                  <div>
                    <strong>Total Rituals:</strong> You now have 12 rituals (10 regular + 2 beta)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">✅</span>
                  <div>
                    <strong>Unlock Check-In:</strong> Complete 3 or more rituals to unlock the Daily Check-In
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">✅</span>
                  <div>
                    <strong>Daily Reset:</strong> All rituals and timers reset daily at midnight UTC
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">✅</span>
                  <div>
                    <strong>Share to Farcaster:</strong> Sharing your completions helps engagement!
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold">✅</span>
                  <div>
                    <strong>Response Time:</strong> We respond to bug reports within 24-48 hours
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent">
            Ready to Start Testing?
          </h3>
          <Link
            href="/rituals"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg text-lg font-bold rounded-lg hover:brightness-110 transition-all"
          >
            <Flame className="w-6 h-6" />
            Go to Rituals Page
          </Link>
        </div>

      </div>
    </div>
  );
}
