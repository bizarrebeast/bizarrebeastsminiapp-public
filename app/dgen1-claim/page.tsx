'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Lock,
  Unlock,
  Loader
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DGEN1ClaimPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [hasDGEN1, setHasDGEN1] = useState<boolean | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleCheckEligibility = async () => {
    setIsChecking(true);
    // Simulate checking wallet
    await new Promise(resolve => setTimeout(resolve, 1500));
    setHasDGEN1(true); // Mock result
    setIsChecking(false);
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    // Simulate claiming
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsClaimed(true);
    setIsClaiming(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="border-b border-gem-crystal/20 bg-dark-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/nft"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gem-crystal transition-colors"
          >
            ← Back to NFTs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 border border-gem-crystal/40 rounded-full mb-6 shadow-lg shadow-gem-crystal/20">
            <Sparkles className="w-5 h-5 text-gem-crystal animate-pulse" />
            <span className="text-sm font-bold text-gem-crystal">DGEN1 EXCLUSIVE</span>
            <Sparkles className="w-5 h-5 text-gem-gold animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            DGEN1 Exclusive NFT
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto">
            Exclusive NFT for DGEN1 holders. Connect your wallet to check eligibility and claim your NFT.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border-2 border-gem-crystal/30 rounded-3xl overflow-hidden shadow-2xl shadow-gem-crystal/10">
          {/* NFT Preview */}
          <div className="relative w-full mx-auto p-4 md:p-8">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-gem-crystal/40 shadow-2xl shadow-gem-crystal/20 bg-gradient-to-br from-gem-crystal/10 to-gem-gold/10">
              <Image
                src="/assets/nft/dgen1-claim-art.png"
                alt="DGEN1 Exclusive NFT"
                fill
                className="object-cover"
                priority
              />
              {!hasDGEN1 && hasDGEN1 !== null && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 font-semibold">Not Eligible</p>
                  </div>
                </div>
              )}
              {isClaimed && (
                <div className="absolute inset-0 bg-gem-crystal/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-gem-crystal mx-auto mb-4" />
                    <p className="text-gem-crystal font-semibold text-xl">Claimed!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="p-8 space-y-6">
            {/* NFT Details */}
            <div className="border-b border-gem-crystal/20 pb-6">
              <h2 className="text-xl font-bold text-white mb-2">
                DGEN1 Exclusive
              </h2>
              <p className="text-gray-300 leading-relaxed">
                An exclusive NFT featuring original BizarreBeasts artwork. Only available to DGEN1 holders.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gem-crystal/10 to-gem-crystal/5 rounded-xl p-4 text-center border border-gem-crystal/20">
                <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Supply</div>
                <div className="text-xl font-bold text-gem-crystal">TBD</div>
              </div>
              <div className="bg-gradient-to-br from-gem-gold/10 to-gem-gold/5 rounded-xl p-4 text-center border border-gem-gold/20">
                <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Price</div>
                <div className="text-xl font-bold text-gem-gold">FREE</div>
              </div>
              <div className="bg-gradient-to-br from-gem-pink/10 to-gem-pink/5 rounded-xl p-4 text-center border border-gem-pink/20">
                <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Network</div>
                <div className="text-xl font-bold text-gem-pink">Base</div>
              </div>
            </div>

            {/* Eligibility Check / Claim Section */}
            <div className="bg-gradient-to-br from-gem-crystal/10 via-gem-gold/5 to-gem-pink/5 border border-gem-crystal/30 rounded-xl p-6 space-y-4">
              {hasDGEN1 === null ? (
                // Initial State - Coming Soon
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-gem-crystal/20 rounded-lg">
                      <Lock className="w-5 h-5 text-gem-crystal" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Coming Soon
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        The claim process is not yet available. Check back soon or follow BizarreBeasts on social media for updates on when claiming will begin.
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={true}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-300 cursor-not-allowed flex items-center justify-center gap-2 opacity-60"
                  >
                    <Lock className="w-5 h-5" />
                    Check Eligibility - Coming Soon
                  </button>
                </>
              ) : hasDGEN1 && !isClaimed ? (
                // Eligible - Can Claim
                <>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 border border-gem-crystal/40 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-gem-crystal mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-gem-crystal mb-1">
                        You're Eligible!
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Your wallet holds a DGEN1 NFT. You can claim this exclusive NFT for free.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-gem-crystal to-gem-gold hover:from-gem-crystal/90 hover:to-gem-gold/90 text-dark-bg font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-gem-gold/30 transform hover:scale-105"
                  >
                    {isClaiming ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Claiming NFT...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Claim Exclusive NFT
                      </>
                    )}
                  </button>
                </>
              ) : hasDGEN1 && isClaimed ? (
                // Claimed Successfully
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 border border-gem-crystal/40 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gem-crystal mt-0.5 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gem-crystal mb-1">
                      Successfully Claimed!
                    </h3>
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                      Your exclusive NFT has been minted and sent to your wallet.
                    </p>
                    <Link
                      href="/nft"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gem-crystal hover:text-gem-gold transition-colors"
                    >
                      View in Your Collection
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                // Not Eligible
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/40 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-red-400 mb-1">
                      Not Eligible
                    </h3>
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                      Your wallet doesn't hold a DGEN1 NFT. This claim is exclusive to DGEN1 holders.
                    </p>
                    <a
                      href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gem-crystal hover:text-gem-gold transition-colors"
                    >
                      Learn More About DGEN1
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border border-yellow-500/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-yellow-400 mb-1">Important</p>
                  <p className="leading-relaxed">
                    This NFT can only be claimed once per DGEN1 holder. Make sure you're connected with the wallet that holds your DGEN1 NFT.
                  </p>
                </div>
              </div>
            </div>

            {/* Learn More Link */}
            <div className="pt-4 border-t border-gem-crystal/20">
              <a
                href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gem-crystal hover:text-gem-gold transition-colors"
              >
                <span>Learn more about DGEN1 App Store</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-5 hover:border-gem-crystal/40 transition-colors">
              <h3 className="text-base font-semibold text-white mb-2">Who is eligible to claim?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Only wallets holding a DGEN1 NFT can claim this exclusive NFT. One claim per DGEN1 holder.
              </p>
            </div>

            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-5 hover:border-gem-crystal/40 transition-colors">
              <h3 className="text-base font-semibold text-white mb-2">Is there a cost to claim?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                No! This is a free claim for DGEN1 holders. You'll only need to pay gas fees for the transaction on Base network.
              </p>
            </div>

            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-5 hover:border-gem-crystal/40 transition-colors">
              <h3 className="text-base font-semibold text-white mb-2">What blockchain is this on?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Minted on Base.
              </p>
            </div>

            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-5 hover:border-gem-crystal/40 transition-colors">
              <h3 className="text-base font-semibold text-white mb-2">When does the claim period end?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                The claim period will be announced soon. Make sure to follow BizarreBeasts on social media for updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
